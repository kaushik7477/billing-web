const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { broadcastChange } = require('../events');

// GET /api/rooms (Get rooms floor-by-floor with live status flags, optionally for all hotels)
router.get('/', async (req, res) => {
  try {
    const { hotelId, date } = req.query;
    
    let rooms = [];
    if (!hotelId || hotelId === 'all') {
      const hotels = ['hotel-1', 'hotel-2', 'hotel-3'];
      for (const hId of hotels) {
        const hotelRooms = await db.getRooms(hId, date);
        rooms.push(...hotelRooms);
      }
    } else {
      rooms = await db.getRooms(hotelId, date);
    }

    // Group rooms by floor
    const floorsMap = {};
    rooms.forEach(r => {
      const fl = r.floor || 1;
      if (!floorsMap[fl]) floorsMap[fl] = [];
      floorsMap[fl].push(r);
    });

    res.json({
      success: true,
      count: rooms.length,
      rooms,
      floors: floorsMap
    });
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve room status.' });
  }
});

// GET /api/rooms/all-issues (Get all maintenance alerts across all hotels)
router.get('/all-issues', async (req, res) => {
  try {
    const { hotelId } = req.query;
    const issues = await db.getAllRoomIssues(hotelId || 'all');
    res.json({
      success: true,
      count: issues.length,
      issues
    });
  } catch (err) {
    console.error('Error fetching all room issues:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve room issues.' });
  }
});

// POST /api/rooms (Super Admin: Add new room to inventory)
router.post('/', async (req, res) => {
  try {
    const { hotelId, roomNumber, floor, roomType, defaultRent, pricePerDay } = req.body;
    const rent = defaultRent !== undefined ? defaultRent : pricePerDay;
    if (!hotelId || !roomNumber || !roomType || rent === undefined) {
      return res.status(400).json({ success: false, message: 'hotelId, roomNumber, roomType, and defaultRent are required.' });
    }

    const newRoom = await db.addRoom({ 
      hotelId, 
      roomNumber, 
      floor, 
      roomType, 
      defaultRent: parseFloat(rent) || 1500 
    });
    broadcastChange('ROOMS_UPDATED', { hotelId, action: 'ADD_ROOM', roomNumber });
    res.status(201).json({
      success: true,
      message: `Room ${roomNumber} added to inventory.`,
      room: newRoom
    });
  } catch (err) {
    console.error('Error adding room:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to add room.' });
  }
});

// PUT /api/rooms/:hotelId/:roomNumber (Super Admin: Edit room tariff/type/floor)
router.put('/:hotelId/:roomNumber', async (req, res) => {
  try {
    const { hotelId, roomNumber } = req.params;
    const updated = await db.updateRoomTariff(hotelId, roomNumber, req.body);
    broadcastChange('ROOMS_UPDATED', { hotelId, action: 'UPDATE_TARIFF', roomNumber });
    res.json({
      success: true,
      message: `Room ${roomNumber} updated successfully.`,
      room: updated
    });
  } catch (err) {
    console.error('Error updating room:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to update room.' });
  }
});

// DELETE /api/rooms/:hotelId/:roomNumber (Super Admin: Delete room)
router.delete('/:hotelId/:roomNumber', async (req, res) => {
  try {
    const { hotelId, roomNumber } = req.params;
    await db.deleteRoom(hotelId, roomNumber);
    broadcastChange('ROOMS_UPDATED', { hotelId, action: 'DELETE_ROOM', roomNumber });
    res.json({
      success: true,
      message: `Room ${roomNumber} removed from inventory.`
    });
  } catch (err) {
    console.error('Error deleting room:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to delete room.' });
  }
});

// PUT /api/rooms/:roomNumber/status (Update room status)
router.put('/:roomNumber/status', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const { hotelId, status, maintenanceMinutes } = req.body;

    if (!hotelId || !status) {
      return res.status(400).json({ success: false, message: 'Hotel ID and status are required.' });
    }

    await db.updateRoomStatus(hotelId, roomNumber, status, maintenanceMinutes || 0);
    broadcastChange('ROOMS_UPDATED', { hotelId, action: 'STATUS_CHANGE', roomNumber, status });
    res.json({ success: true, message: `Room ${roomNumber} status updated to ${status}.` });
  } catch (err) {
    console.error('Error updating room status:', err);
    res.status(500).json({ success: false, message: 'Failed to update room status.' });
  }
});

// POST /api/rooms/:roomNumber/issues (Report / Add room issue)
router.post('/:roomNumber/issues', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const { hotelId, issueText, reportedBy } = req.body;

    if (!hotelId || !issueText) {
      return res.status(400).json({ success: false, message: 'Hotel ID and issue description are required.' });
    }

    const issue = await db.addRoomIssue(hotelId, roomNumber, issueText, reportedBy || 'Manager');
    broadcastChange('ROOMS_UPDATED', { hotelId, action: 'ISSUE_REPORTED', roomNumber });
    res.json({
      success: true,
      message: `Issue reported for Room ${roomNumber}.`,
      issue
    });
  } catch (err) {
    console.error('Error reporting room issue:', err);
    res.status(500).json({ success: false, message: 'Failed to report room issue.' });
  }
});

// PUT /api/rooms/:roomNumber/issues/fix (Mark issue fixed / resolved)
router.put('/:roomNumber/issues/fix', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const { hotelId, issueId } = req.body;

    if (!hotelId) {
      return res.status(400).json({ success: false, message: 'Hotel ID is required.' });
    }

    await db.fixRoomIssue(hotelId, roomNumber, issueId);
    broadcastChange('ROOMS_UPDATED', { hotelId, action: 'ISSUE_FIXED', roomNumber });
    res.json({
      success: true,
      message: `Issue for Room ${roomNumber} marked as fixed.`
    });
  } catch (err) {
    console.error('Error fixing room issue:', err);
    res.status(500).json({ success: false, message: 'Failed to fix room issue.' });
  }
});

// POST /api/rooms/:roomNumber/checkout (Checkout room -> 30-min housekeeping cycle)
router.post('/:roomNumber/checkout', async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const { hotelId } = req.body;

    if (!hotelId) {
      return res.status(400).json({ success: false, message: 'Hotel ID is required.' });
    }

    await db.checkoutRoom(hotelId, roomNumber);
    broadcastChange('ROOMS_UPDATED', { hotelId, action: 'CHECKOUT', roomNumber });
    res.json({
      success: true,
      message: `Room ${roomNumber} checked out. 30-minute housekeeping cycle initiated.`
    });
  } catch (err) {
    console.error('Error checking out room:', err);
    res.status(500).json({ success: false, message: 'Failed to checkout room.' });
  }
});

module.exports = router;

