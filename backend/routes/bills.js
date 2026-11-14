const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { verifyToken } = require('../middleware/auth');
const { broadcastChange } = require('../events');

// Helper to generate unique sequential invoice number
// Supports:
// 1. Independent Non-GST series (10001, 10002...)
// 2. Hotel-configured GST series: 'numeric' (1769, 1770...) or 'standard' (HSP/26/00001...)
async function generateNextInvoiceNo(hotelId, hotelName = '', isNonGST = false) {
  const hotel = await db.getHotelById(hotelId);
  const allBills = await db.getBills({ hotelId });

  // 1. NON-GST (META DATA) INVOICE SERIES
  if (isNonGST) {
    const startNum = Number(hotel?.nonGstStartNumber) || 10001;
    let maxSeq = 0;

    for (const b of allBills) {
      if (b.isNonGST) {
        const num = parseInt(b.invoiceNo, 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }

    const nextSeq = maxSeq >= startNum ? maxSeq + 1 : startNum;
    return {
      isNonGST: true,
      nextSeq,
      nextInvoiceNo: String(nextSeq)
    };
  }

  // 2. STANDARD / NUMERIC GST INVOICE SERIES
  const format = hotel?.invoiceFormat || 'standard';

  if (format === 'numeric') {
    const startNum = Number(hotel?.customInvoiceStart) || 1;
    let maxSeq = 0;

    for (const b of allBills) {
      if (!b.isNonGST) {
        const raw = String(b.invoiceNo || '').trim();
        if (/^\d+$/.test(raw)) {
          const num = parseInt(raw, 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    }

    const nextSeq = maxSeq >= startNum ? maxSeq + 1 : startNum;
    return {
      isNonGST: false,
      invoiceFormat: 'numeric',
      nextSeq,
      nextInvoiceNo: String(nextSeq)
    };
  }

  // Standard Format with prefix e.g. HR/26/00001, HS/26/00001
  let prefix = 'HR';
  if (hotelId === 'hotel-1' || /rojana/i.test(hotelName || '')) {
    prefix = 'HR';
  } else if (hotelId === 'hotel-2' || /serena|sagar\s*priya/i.test(hotelName || '')) {
    prefix = 'HS';
  } else if (hotelId === 'hotel-3' || /sea\s*pearl/i.test(hotelName || '')) {
    prefix = 'HSP2';
  } else if (hotelName) {
    prefix = hotelName
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .map(w => w[0])
      .join('')
      .toUpperCase() || 'HB';
  }

  const yy = String(new Date().getFullYear()).slice(-2); // "26"
  const prefixYear = `${prefix}/${yy}/`;

  let maxSeq = 0;
  for (const b of allBills) {
    if (!b.isNonGST && b.invoiceNo && (b.invoiceNo.startsWith(prefixYear) || (hotelId === 'hotel-2' && b.invoiceNo.startsWith(`HSP/${yy}/`)))) {
      const parts = b.invoiceNo.split('/');
      if (parts.length >= 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  const customStart = Number(hotel?.customInvoiceStart) || 1;
  const nextSeq = maxSeq >= customStart ? maxSeq + 1 : customStart;
  const nextInvoiceNo = `${prefixYear}${String(nextSeq).padStart(5, '0')}`;
  return {
    isNonGST: false,
    invoiceFormat: 'standard',
    prefix,
    yy,
    nextSeq,
    nextInvoiceNo
  };
}

// GET /api/bills/next-invoice-no (Fetch next sequential invoice number for a property)
router.get('/next-invoice-no', async (req, res) => {
  try {
    const { hotelId, hotelName, isNonGST } = req.query;
    if (!hotelId) {
      return res.status(400).json({ success: false, message: 'hotelId is required' });
    }
    const info = await generateNextInvoiceNo(hotelId, hotelName, isNonGST === 'true' || isNonGST === true);
    res.json({ success: true, ...info });
  } catch (err) {
    console.error('Error getting next invoice no:', err);
    res.status(500).json({ success: false, message: 'Failed to generate next invoice number' });
  }
});

// POST /api/bills (Create new bill)
router.post('/', async (req, res) => {
  try {
    const billData = req.body;

    if (!billData.hotelId || !billData.customerName || !billData.roomNumber || billData.netTotal === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required bill fields (hotelId, customerName, roomNumber, netTotal).' });
    }

    const isNonGST = Boolean(billData.isNonGST);

    // Auto generate sequential invoice serial if not provided or legacy format
    if (!billData.invoiceNo || billData.invoiceNo.includes('-2026-')) {
      const { nextInvoiceNo } = await generateNextInvoiceNo(billData.hotelId, billData.hotelName, isNonGST);
      billData.invoiceNo = nextInvoiceNo;
    } else {
      // Check if invoiceNo already exists for another bill to guarantee uniqueness
      const existing = await db.getBills({ hotelId: billData.hotelId });
      const dup = existing.find(b => b.invoiceNo === billData.invoiceNo && (b._id || b.id) !== (billData._id || billData.id));
      if (dup) {
        const { nextInvoiceNo } = await generateNextInvoiceNo(billData.hotelId, billData.hotelName, isNonGST);
        billData.invoiceNo = nextInvoiceNo;
      }
    }

    // Calculate status
    const balance = parseFloat(billData.balanceDue) || 0;
    billData.paymentStatus = balance <= 0 ? 'PAID' : 'DUE';
    billData.billStatus = billData.billStatus || 'SAVED';

    const savedBill = await db.createBill(billData);

    // Automatically mark the room as occupied by this guest
    if (billData.roomNumber && billData.hotelId) {
      await db.assignRoom(
        billData.hotelId, 
        billData.roomNumber, 
        billData.customerName, 
        savedBill.id || savedBill._id, 
        savedBill.invoiceNo,
        billData.checkInDateTime,
        billData.checkOutDateTime
      );
    }

    // Broadcast instant sync event to all open tabs and devices
    broadcastChange('ROOMS_UPDATED', { hotelId: billData.hotelId, action: 'CHECKIN', roomNumber: billData.roomNumber });
    broadcastChange('BILLS_UPDATED', { hotelId: billData.hotelId, action: 'CREATE' });

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
// Query params: hotelId, billStatus, startDate, endDate, paymentMode, paymentStatus
router.get('/', async (req, res) => {
  try {
    const { hotelId, billStatus, startDate, endDate, paymentMode, paymentStatus } = req.query;
    const filter = { hotelId, startDate, endDate, paymentMode, paymentStatus };
    let bills = await db.getBills(filter);

    // Filter by billStatus ('SAVED' vs 'CLOSED') if provided
    if (billStatus && billStatus !== 'all') {
      if (billStatus === 'SAVED') {
        bills = bills.filter(b => b.billStatus !== 'CLOSED');
      } else if (billStatus === 'CLOSED') {
        bills = bills.filter(b => b.billStatus === 'CLOSED');
      }
    }

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

// PUT /api/bills/:id (Update existing saved bill)
router.put('/:id', async (req, res) => {
  try {
    const updateData = req.body;
    const balance = parseFloat(updateData.balanceDue) || 0;
    if (updateData.balanceDue !== undefined) {
      updateData.paymentStatus = balance <= 0 ? 'PAID' : 'DUE';
    }

    const updated = await db.updateBill(req.params.id, updateData);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Bill not found.' });
    }

    // Keep room assigned & release any vacated room(s)
    if (updated.roomNumber && updated.hotelId) {
      await db.assignRoom(
        updated.hotelId, 
        updated.roomNumber, 
        updated.customerName, 
        updated.id || updated._id || req.params.id, 
        updated.invoiceNo,
        updated.checkInDateTime,
        updated.checkOutDateTime
      );
    }

    broadcastChange('ROOMS_UPDATED', { hotelId: updated.hotelId, action: 'UPDATE' });
    broadcastChange('BILLS_UPDATED', { hotelId: updated.hotelId, action: 'UPDATE' });

    res.json({
      success: true,
      message: `Invoice ${updated.invoiceNo} updated successfully.`,
      bill: updated
    });
  } catch (err) {
    console.error('Error updating bill:', err);
    res.status(500).json({ success: false, message: 'Failed to update bill.' });
  }
});

// POST /api/bills/:id/checkout (Checkout & finalize bill -> 30-min housekeeping cycle)
router.post('/:id/checkout', async (req, res) => {
  try {
    const closed = await db.checkoutBill(req.params.id);
    if (!closed) {
      return res.status(404).json({ success: false, message: 'Bill not found.' });
    }

    broadcastChange('ROOMS_UPDATED', { hotelId: closed.hotelId, action: 'CHECKOUT', roomNumber: closed.roomNumber });
    broadcastChange('BILLS_UPDATED', { hotelId: closed.hotelId, action: 'CHECKOUT' });

    res.json({
      success: true,
      message: `Guest checked out! Invoice ${closed.invoiceNo} closed. Room ${closed.roomNumber} entered 30-min housekeeping.`,
      bill: closed
    });
  } catch (err) {
    console.error('Error checking out bill:', err);
    res.status(500).json({ success: false, message: 'Failed to checkout bill.' });
  }
});

// DELETE /api/bills/:id (Delete bill)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const success = await db.deleteBill(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Bill not found or already deleted.' });
    }
    broadcastChange('BILLS_UPDATED', { action: 'DELETE' });
    broadcastChange('ROOMS_UPDATED', { action: 'DELETE' });
    res.json({ success: true, message: 'Bill deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete bill.' });
  }
});

module.exports = router;
