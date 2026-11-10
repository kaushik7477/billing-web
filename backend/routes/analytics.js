const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { verifyAdmin } = require('../middleware/auth');

// Helper to filter bills in memory
function applyFilters(bills, query) {
  let filtered = [...bills];
  const { hotelId, startDate, endDate, paymentMode, paymentStatus } = query;

  if (hotelId && hotelId !== 'all') {
    filtered = filtered.filter(b => b.hotelId === hotelId);
  }

  if (paymentMode && paymentMode !== 'all') {
    filtered = filtered.filter(b => b.paymentMode && b.paymentMode.toLowerCase().includes(paymentMode.toLowerCase()));
  }

  if (paymentStatus && paymentStatus !== 'all') {
    filtered = filtered.filter(b => b.paymentStatus === paymentStatus);
  }

  if (startDate) {
    const start = new Date(startDate);
    filtered = filtered.filter(b => new Date(b.billDateTime || b.createdAt) >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter(b => new Date(b.billDateTime || b.createdAt) <= end);
  }

  return filtered;
}

// GET /api/analytics/summary (Super Admin - Overall KPI stats)
router.get('/summary', verifyAdmin, async (req, res) => {
  try {
    const allBills = await db.getBills({});
    const bills = applyFilters(allBills, req.query);

    let totalRevenue = 0;
    let totalAdvance = 0;
    let totalBalanceDue = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalGuests = 0;

    const paymentModes = {};
    const hotelStats = {
      'hotel-1': { count: 0, revenue: 0, name: 'Hotel Rojana' },
      'hotel-2': { count: 0, revenue: 0, name: 'Hotel Sagar Priya' },
      'hotel-3': { count: 0, revenue: 0, name: 'Hotel Sea Pearl' }
    };

    bills.forEach(b => {
      const net = parseFloat(b.netTotal) || 0;
      const adv = parseFloat(b.advancePaid) || 0;
      const due = parseFloat(b.balanceDue) || 0;
      const cgst = parseFloat(b.cgst) || 0;
      const sgst = parseFloat(b.sgst) || 0;
      const persons = parseInt(b.numPersons) || 1;

      totalRevenue += net;
      totalAdvance += adv;
      totalBalanceDue += due;
      totalCgst += cgst;
      totalSgst += sgst;
      totalGuests += persons;

      // Payment mode breakdown
      const mode = b.paymentMode || 'Cash';
      paymentModes[mode] = (paymentModes[mode] || 0) + net;

      // Hotel breakdown
      if (b.hotelId && hotelStats[b.hotelId]) {
        hotelStats[b.hotelId].count += 1;
        hotelStats[b.hotelId].revenue += net;
      }
    });

    res.json({
      success: true,
      summary: {
        totalBills: bills.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalAdvance: Math.round(totalAdvance * 100) / 100,
        totalBalanceDue: Math.round(totalBalanceDue * 100) / 100,
        totalGst: Math.round((totalCgst + totalSgst) * 100) / 100,
        totalCgst: Math.round(totalCgst * 100) / 100,
        totalSgst: Math.round(totalSgst * 100) / 100,
        totalGuests,
        paymentModes,
        hotelStats
      }
    });
  } catch (err) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute analytics summary.' });
  }
});

// GET /api/analytics/day-by-day (Day by day financial report)
router.get('/day-by-day', verifyAdmin, async (req, res) => {
  try {
    const allBills = await db.getBills({});
    const bills = applyFilters(allBills, req.query);

    const dayMap = {};

    bills.forEach(b => {
      const dt = new Date(b.billDateTime || b.createdAt);
      const dateKey = dt.toISOString().split('T')[0]; // "YYYY-MM-DD"
      const dateLabel = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          dateKey,
          dateLabel,
          billsCount: 0,
          revenue: 0,
          advance: 0,
          balanceDue: 0,
          gst: 0,
          guests: 0,
          hotels: {}
        };
      }

      const net = parseFloat(b.netTotal) || 0;
      const adv = parseFloat(b.advancePaid) || 0;
      const due = parseFloat(b.balanceDue) || 0;
      const gst = (parseFloat(b.cgst) || 0) + (parseFloat(b.sgst) || 0);
      const persons = parseInt(b.numPersons) || 1;

      dayMap[dateKey].billsCount += 1;
      dayMap[dateKey].revenue += net;
      dayMap[dateKey].advance += adv;
      dayMap[dateKey].balanceDue += due;
      dayMap[dateKey].gst += gst;
      dayMap[dateKey].guests += persons;

      dayMap[dateKey].hotels[b.hotelName || b.hotelId] = (dayMap[dateKey].hotels[b.hotelName || b.hotelId] || 0) + net;
    });

    const dayByDay = Object.values(dayMap).sort((a, b) => b.dateKey.localeCompare(a.dateKey));

    res.json({ success: true, count: dayByDay.length, data: dayByDay });
  } catch (err) {
    console.error('Day by day analytics error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute day by day financials.' });
  }
});

// GET /api/analytics/weekly (Weekly financial report)
router.get('/weekly', verifyAdmin, async (req, res) => {
  try {
    const allBills = await db.getBills({});
    const bills = applyFilters(allBills, req.query);

    const weekMap = {};

    bills.forEach(b => {
      const dt = new Date(b.billDateTime || b.createdAt);
      // Compute start of week (Monday)
      const day = dt.getDay();
      const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(dt.setDate(diff));
      const weekKey = startOfWeek.toISOString().split('T')[0];
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const weekLabel = `${startOfWeek.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${endOfWeek.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = {
          weekKey,
          weekLabel,
          billsCount: 0,
          revenue: 0,
          advance: 0,
          balanceDue: 0,
          gst: 0,
          guests: 0
        };
      }

      const net = parseFloat(b.netTotal) || 0;
      const adv = parseFloat(b.advancePaid) || 0;
      const due = parseFloat(b.balanceDue) || 0;
      const gst = (parseFloat(b.cgst) || 0) + (parseFloat(b.sgst) || 0);

      weekMap[weekKey].billsCount += 1;
      weekMap[weekKey].revenue += net;
      weekMap[weekKey].advance += adv;
      weekMap[weekKey].balanceDue += due;
      weekMap[weekKey].gst += gst;
      weekMap[weekKey].guests += (parseInt(b.numPersons) || 1);
    });

    const weekly = Object.values(weekMap).sort((a, b) => b.weekKey.localeCompare(a.weekKey));

    res.json({ success: true, count: weekly.length, data: weekly });
  } catch (err) {
    console.error('Weekly analytics error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute weekly financials.' });
  }
});

// GET /api/analytics/monthly (Monthly financial report)
router.get('/monthly', verifyAdmin, async (req, res) => {
  try {
    const allBills = await db.getBills({});
    const bills = applyFilters(allBills, req.query);

    const monthMap = {};

    bills.forEach(b => {
      const dt = new Date(b.billDateTime || b.createdAt);
      const monthKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = dt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          monthKey,
          monthLabel,
          billsCount: 0,
          revenue: 0,
          advance: 0,
          balanceDue: 0,
          gst: 0,
          guests: 0
        };
      }

      const net = parseFloat(b.netTotal) || 0;
      const adv = parseFloat(b.advancePaid) || 0;
      const due = parseFloat(b.balanceDue) || 0;
      const gst = (parseFloat(b.cgst) || 0) + (parseFloat(b.sgst) || 0);

      monthMap[monthKey].billsCount += 1;
      monthMap[monthKey].revenue += net;
      monthMap[monthKey].advance += adv;
      monthMap[monthKey].balanceDue += due;
      monthMap[monthKey].gst += gst;
      monthMap[monthKey].guests += (parseInt(b.numPersons) || 1);
    });

    const monthly = Object.values(monthMap).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    res.json({ success: true, count: monthly.length, data: monthly });
  } catch (err) {
    console.error('Monthly analytics error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute monthly financials.' });
  }
});

// GET /api/analytics/export-csv (Export bills to CSV)
router.get('/export-csv', verifyAdmin, async (req, res) => {
  try {
    const allBills = await db.getBills({});
    const bills = applyFilters(allBills, req.query);

    const headers = [
      'Invoice No', 'Hotel Name', 'Bill Date', 'Customer Name', 'Phone', 'ID Proof',
      'Room Type', 'Room Number', 'Persons', 'Days', 'Rent/Day', 'Subtotal',
      'CGST (2.5%)', 'SGST (2.5%)', 'Total GST', 'Net Total', 'Advance Paid', 'Balance Due',
      'Payment Mode', 'Status'
    ];

    const rows = bills.map(b => [
      `"${b.invoiceNo || ''}"`,
      `"${b.hotelName || ''}"`,
      `"${b.billDate || ''}"`,
      `"${b.customerName || ''}"`,
      `"${b.customerPhone || ''}"`,
      `"${b.idType || ''}: ${b.idNumber || ''}"`,
      `"${b.roomType || ''}"`,
      `"${b.roomNumber || ''}"`,
      b.numPersons || 1,
      b.numDays || 1,
      b.roomRentPerDay || 0,
      b.subtotal || 0,
      b.cgst || 0,
      b.sgst || 0,
      b.totalGst || 0,
      b.netTotal || 0,
      b.advancePaid || 0,
      b.balanceDue || 0,
      `"${b.paymentMode || ''}"`,
      `"${b.paymentStatus || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Hotel-Financial-Report.csv"');
    res.send(csvContent);
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ success: false, message: 'Failed to export CSV.' });
  }
});

module.exports = router;
