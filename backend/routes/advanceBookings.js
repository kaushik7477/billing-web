const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/advance-bookings
router.get('/', async (req, res) => {
  try {
    const { hotelId } = req.query;
    const bookings = await db.getAdvanceBookings(hotelId || 'all');
    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (err) {
    console.error('Error fetching advance bookings:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve advance bookings.' });
  }
});

// POST /api/advance-bookings (Create new advance booking)
router.post('/', async (req, res) => {
  try {
    const bookingData = req.body;
    if (!bookingData.hotelId || !bookingData.customerName || !bookingData.checkInDate || !bookingData.roomType) {
      return res.status(400).json({
        success: false,
        message: 'Guest name, hotel ID, check-in date, and room type are required.'
      });
    }

    const newBooking = await db.createAdvanceBooking(bookingData);
    res.status(201).json({
      success: true,
      message: `Advance booking for ${newBooking.customerName} created successfully (${newBooking.bookingId}).`,
      booking: newBooking
    });
  } catch (err) {
    console.error('Error creating advance booking:', err);
    res.status(500).json({ success: false, message: 'Failed to save advance booking.' });
  }
});

// PUT /api/advance-bookings/:bookingId (Update advance booking / mark checked-in)
router.put('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    await db.updateAdvanceBooking(bookingId, req.body);
    res.json({
      success: true,
      message: `Booking ${bookingId} updated successfully.`
    });
  } catch (err) {
    console.error('Error updating advance booking:', err);
    res.status(500).json({ success: false, message: 'Failed to update advance booking.' });
  }
});

module.exports = router;

