const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { verifyToken } = require('../middleware/auth');

// POST /api/bills (Create new bill)
router.post('/', async (req, res) => {
  try {
    const billData = req.body;

    if (!billData.hotelId || !billData.customerName || !billData.roomNumber || billData.netTotal === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required bill fields (hotelId, customerName, roomNumber, netTotal).' });
    }

    // Auto generate invoice serial if not provided
    if (!billData.invoiceNo) {
      const year = new Date().getFullYear();
      const prefix = billData.hotelId === 'hotel-1' ? 'HR' : billData.hotelId === 'hotel-2' ? 'HSP' : 'HSP2';
      const rand = Math.floor(1000 + Math.random() * 9000);
      billData.invoiceNo = `${prefix}-${year}-${rand}`;
    }

    // Calculate or verify status
    const balance = parseFloat(billData.balanceDue) || 0;
    billData.paymentStatus = balance <= 0 ? 'PAID' : 'DUE';

    const savedBill = await db.createBill(billData);

    res.status(201).json({
      success: true,
      message: `Invoice ${savedBill.invoiceNo} saved successfully.`,
      bill: savedBill
    });
  } catch (err) {
    console.error('Error creating bill:', err);
    res.status(500).json({ success: false, message: 'Failed to save invoice.' });
  }
});

// GET /api/bills (Query bills with filters)
// Query params: hotelId, startDate, endDate, paymentMode, paymentStatus
router.get('/', async (req, res) => {
  try {
    const { hotelId, startDate, endDate, paymentMode, paymentStatus } = req.query;
    const filter = { hotelId, startDate, endDate, paymentMode, paymentStatus };
    const bills = await db.getBills(filter);
    res.json({ success: true, count: bills.length, bills });
  } catch (err) {
    console.error('Error fetching bills:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve bills.' });
  }
});

// GET /api/bills/:id (Get single bill)
router.get('/:id', async (req, res) => {
  try {
    const bill = await db.getBillById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found.' });
    }
    res.json({ success: true, bill });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve bill.' });
  }
});

// DELETE /api/bills/:id (Delete bill)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const success = await db.deleteBill(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Bill not found or already deleted.' });
    }
    res.json({ success: true, message: 'Bill deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete bill.' });
  }
});

module.exports = router;
