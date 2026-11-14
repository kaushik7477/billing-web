const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { verifyAdmin } = require('../middleware/auth');
const { broadcastChange } = require('../events');

// GET /api/hotels (Public - for 3 Hotel Selection Cards on Landing Page)
router.get('/', async (req, res) => {
  try {
    const hotels = await db.getHotels();
    // Return hotel cards without exposing PIN to public frontend
    const publicHotels = hotels.map(h => ({
      hotelId: h.hotelId,
      name: h.name,
      subText: h.subText,
      address: h.address,
      phone: h.phone,
      gstin: h.gstin,
      themeColor: h.themeColor,
      tagline: h.tagline,
      roomTypes: h.roomTypes,
      signatureImage: h.signatureImage,
      isActive: h.isActive
    }));
    res.json({ success: true, hotels: publicHotels });
  } catch (err) {
    console.error('Error fetching hotels:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch hotels.' });
  }
});

// GET /api/hotels/admin-list (Super Admin only - includes PINs)
router.get('/admin-list', verifyAdmin, async (req, res) => {
  try {
    const hotels = await db.getHotels();
    res.json({ success: true, hotels });
  } catch (err) {
    console.error('Error fetching admin hotel list:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch admin hotel list.' });
  }
});

// GET /api/hotels/:hotelId (Single hotel)
router.get('/:hotelId', async (req, res) => {
  try {
    const hotel = await db.getHotelById(req.params.hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }
    const publicHotel = { ...hotel };
    delete publicHotel.managerPin;
    res.json({ success: true, hotel: publicHotel });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch hotel details.' });
  }
});

// PUT /api/hotels/:hotelId/credentials (Super Admin - Update Manager User ID and Password)
router.put('/:hotelId/credentials', verifyAdmin, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { managerUsername, managerPassword } = req.body;

    if (!managerUsername || String(managerUsername).trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Manager User ID must be at least 3 characters.' });
    }

    if (!managerPassword || String(managerPassword).trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Manager Password must be at least 4 characters.' });
    }

    const cleanUser = String(managerUsername).trim();
    const cleanPass = String(managerPassword).trim();

    // Check if another hotel already has this managerUsername
    const existing = await db.getHotelByUsername(cleanUser);
    if (existing && existing.hotelId !== hotelId) {
      return res.status(400).json({
        success: false,
        message: `User ID "${cleanUser}" is already assigned to ${existing.name}. Please choose a unique User ID.`
      });
    }

    const updatedHotel = await db.updateHotelCredentials(hotelId, cleanUser, cleanPass);
    if (!updatedHotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }

    broadcastChange('HOTELS_UPDATED', { hotelId, action: 'CREDENTIALS' });

    res.json({
      success: true,
      message: `Login credentials for ${updatedHotel.name} updated! (User ID: ${cleanUser})`,
      hotel: updatedHotel
    });
  } catch (err) {
    console.error('Error updating hotel credentials:', err);
    res.status(500).json({ success: false, message: 'Failed to update manager credentials.' });
  }
});

// PUT /api/hotels/:hotelId/pin (Super Admin - Update Manager Login PIN)
router.put('/:hotelId/pin', verifyAdmin, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { newPin } = req.body;

    if (!newPin || String(newPin).trim().length < 4) {
      return res.status(400).json({ success: false, message: 'New PIN must be at least 4 digits.' });
    }

    const updatedHotel = await db.updateHotelPin(hotelId, String(newPin).trim());
    if (!updatedHotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }

    broadcastChange('HOTELS_UPDATED', { hotelId, action: 'PIN' });

    res.json({
      success: true,
      message: `Manager PIN for ${updatedHotel.name} successfully updated to: ${newPin}`,
      hotelId,
      newPin: String(newPin).trim()
    });
  } catch (err) {
    console.error('Error updating hotel PIN:', err);
    res.status(500).json({ success: false, message: 'Failed to update manager PIN.' });
  }
});

// PUT /api/hotels/:hotelId (Super Admin - Update Hotel Branding / Details)
router.put('/:hotelId', verifyAdmin, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const updated = await db.updateHotelDetails(hotelId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }
    broadcastChange('HOTELS_UPDATED', { hotelId, action: 'DETAILS' });
    res.json({ success: true, message: 'Hotel information updated successfully.', hotel: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update hotel information.' });
  }
});

module.exports = router;

