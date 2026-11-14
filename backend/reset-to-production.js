/**
 * PRODUCTION RESET SCRIPT
 * Cleans all dummy / test data from MongoDB Atlas & local JSON backups:
 * - Deletes all test bills / invoices
 * - Deletes all test advance bookings
 * - Resets all rooms to 100% Available (clears test guests, maintenance issues, and bill links)
 * - Preserves hotel properties, room configurations, tariffs, and admin/manager logins
 * - Resets invoice serial numbers to #00001
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DATA_DIR = path.join(__dirname, 'data');
const BILLS_FILE = path.join(DATA_DIR, 'bills.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'advance_bookings.json');
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json');

async function resetToProduction() {
  console.log('========================================================');
  console.log('🧹 STARTING HOTEL BILLING PRODUCTION DATABASE CLEANUP');
  console.log('========================================================');

  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotel_billing_db';
  await mongoose.connect(mongoURI);
  console.log('[DB] Connected to MongoDB Atlas.');

  // 1. Clear All Bills
  const Bill = require('./models/Bill');
  const deletedBills = await Bill.deleteMany({});
  console.log(`[1/4] ✓ Cleared ${deletedBills.deletedCount} bills/invoices from MongoDB.`);

  // 2. Clear All Advance Bookings
  const AdvanceBooking = require('./models/AdvanceBooking');
  const deletedBookings = await AdvanceBooking.deleteMany({});
  console.log(`[2/4] ✓ Cleared ${deletedBookings.deletedCount} advance bookings from MongoDB.`);

  // 3. Reset all Rooms to 100% Available
  const Room = require('./models/Room');
  const roomUpdateResult = await Room.updateMany({}, {
    $set: {
      status: 'available',
      currentGuestName: '',
      currentGuestPhone: '',
      currentBillId: '',
      currentInvoiceNo: '',
      checkInDateTime: '',
      expectedCheckOutDateTime: '',
      maintenanceUntil: null,
      activeIssues: []
    }
  });
  console.log(`[3/4] ✓ Reset ${roomUpdateResult.modifiedCount} rooms to Available (all test guests & issues cleared).`);

  // 4. Update Local JSON Fallbacks
  try {
    fs.writeFileSync(BILLS_FILE, JSON.stringify([], null, 2), 'utf8');
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2), 'utf8');

    // Update rooms.json to match available state
    if (fs.existsSync(ROOMS_FILE)) {
      const localRooms = JSON.parse(fs.readFileSync(ROOMS_FILE, 'utf8') || '[]');
      const cleanedRooms = localRooms.map(r => ({
        ...r,
        status: 'available',
        currentGuestName: '',
        currentGuestPhone: '',
        currentBillId: '',
        currentInvoiceNo: '',
        checkInDateTime: '',
        expectedCheckOutDateTime: '',
        maintenanceUntil: null,
        activeIssues: []
      }));
      fs.writeFileSync(ROOMS_FILE, JSON.stringify(cleanedRooms, null, 2), 'utf8');
    }
    console.log('[4/4] ✓ Local backup JSON files synchronized to clean state.');
  } catch (fsErr) {
    console.warn('[Notice] Could not update local JSON files:', fsErr.message);
  }

  console.log('========================================================');
  console.log('🎉 CLEANUP COMPLETE!');
  console.log('• All test bills and advance reservations removed.');
  console.log('• All rooms are clean, vacant, and Green (Available).');
  console.log('• New invoices will start cleanly from #00001.');
  console.log('• Hotel settings, tariffs, and logins are preserved.');
  console.log('========================================================');

  await mongoose.disconnect();
  process.exit(0);
}

resetToProduction().catch(err => {
  console.error('Reset error:', err);
  process.exit(1);
});

