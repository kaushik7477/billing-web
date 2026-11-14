const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
// Unified single-entry login for Super Admin and all Hotel Managers!
// Automatically directs user to Super Admin Panel or Assigned Hotel Billing Page.
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'User ID and Password are required.' });
    }

    const cleanUsername = String(username).trim();
    const cleanPassword = String(password).trim();

    // 1. Check Super Admin credentials
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (cleanUsername.toLowerCase() === adminUser.toLowerCase() && cleanPassword === adminPass) {
      const token = jwt.sign(
        { role: 'admin', username: adminUser },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({
        success: true,
        role: 'admin',
        message: 'Super Admin authentication successful',
        token,
        user: { username: adminUser, role: 'admin' }
      });
    }

    // 2. Check Hotel Manager by User ID & Password
    const hotel = await db.getHotelByUsername(cleanUsername);
    if (hotel) {
      if (String(hotel.managerPassword).trim() === cleanPassword) {
        const token = jwt.sign(
          {
            role: 'manager',
            hotelId: hotel.hotelId,
            hotelName: hotel.name,
            managerUsername: hotel.managerUsername
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          role: 'manager',
          message: `Welcome to ${hotel.name} Manager Portal`,
          token,
          hotel: {
            hotelId: hotel.hotelId,
            name: hotel.name,
            subText: hotel.subText,
            address: hotel.address,
            phone: hotel.phone,
            gstin: hotel.gstin,
            themeColor: hotel.themeColor,
            tagline: hotel.tagline,
            roomTypes: hotel.roomTypes,
            signatureImage: hotel.signatureImage,
            managerUsername: hotel.managerUsername
          }
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid User ID or Password. Please check credentials or contact Super Admin.'
    });
  } catch (err) {
    console.error('Unified login error:', err);
    res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
});

// POST /api/auth/manager-login
// Manager clicks Hotel box -> Enters PIN -> logs in
router.post('/manager-login', async (req, res) => {
  try {
    const { hotelId, pin } = req.body;

    if (!hotelId || !pin) {
      return res.status(400).json({ success: false, message: 'Hotel selection and 4-digit PIN are required.' });
    }

    const hotel = await db.getHotelById(hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Selected hotel not found.' });
    }

    // Compare PIN
    if (String(hotel.managerPin).trim() !== String(pin).trim()) {
      return res.status(401).json({ success: false, message: 'Invalid Manager PIN. Please check with Super Admin.' });
    }

    // Issue JWT token
    const token = jwt.sign(
      {
        role: 'manager',
        hotelId: hotel.hotelId,
        hotelName: hotel.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: `Welcome to ${hotel.name} Manager Portal`,
      token,
      hotel: {
        hotelId: hotel.hotelId,
        name: hotel.name,
        subText: hotel.subText,
        address: hotel.address,
        phone: hotel.phone,
        gstin: hotel.gstin,
        themeColor: hotel.themeColor,
        tagline: hotel.tagline,
        roomTypes: hotel.roomTypes,
        signatureImage: hotel.signatureImage
      }
    });
  } catch (err) {
    console.error('Manager login error:', err);
    res.status(500).json({ success: false, message: 'Server error during manager login.' });
  }
});

// POST /api/auth/admin-login
// Super Admin login
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    if (username.trim() !== adminUser || password.trim() !== adminPass) {
      return res.status(401).json({ success: false, message: 'Invalid Super Admin credentials.' });
    }

    const token = jwt.sign(
      {
        role: 'admin',
        username: adminUser
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Super Admin authentication successful',
      token,
      user: {
        username: adminUser,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Server error during admin login.' });
  }
});

module.exports = router;

