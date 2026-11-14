const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/activity/overview (Get live activity stats for all hotels)
router.get('/overview', async (req, res) => {
  try {
    const hotels = ['hotel-1', 'hotel-2', 'hotel-3'];
    const overview = {};
    for (const hId of hotels) {
      overview[hId] = await db.getTodayActivity(hId);
    }
    res.json({
      success: true,
      overview
    });
  } catch (err) {
    console.error('Error fetching activity overview:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch activity overview.' });
  }
});

// GET /api/activity/today?hotelId=...
router.get('/today', async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) {
      return res.status(400).json({ success: false, message: 'Hotel ID is required.' });
    }

    const activity = await db.getTodayActivity(hotelId);
    res.json({
      success: true,
      activity
    });
  } catch (err) {
    console.error('Error fetching today activity:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch today activity.' });
  }
});

module.exports = router;

