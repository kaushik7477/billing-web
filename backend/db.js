const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const HOTELS_FILE = path.join(DATA_DIR, 'hotels.json');
const BILLS_FILE = path.join(DATA_DIR, 'bills.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'advance_bookings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper: Get strict Indian Standard Time (IST / Asia/Kolkata) date string "YYYY-MM-DD"
// Ensures day flips exactly at 12:00:00 AM midnight IST without UTC lag
const getISTDateStr = (date = new Date()) => {
  try {
    return new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

let isMongoConnected = false;

// Default initial hotels data
const defaultHotels = [
  {
    hotelId: 'hotel-1',
    name: 'Hotel Rojana',
    subText: 'Organised by Maa Tara Enterprise',
    address: 'New Digha, Mini Holiday Home Sector, Purba Medinipur, W.B.',
    phone: '9046926801',
    gstin: '19ABYFM7409E1Z0',
    managerPin: '1111',
    managerUsername: 'hotel1',
    managerPassword: 'hotel1234',
    themeColor: '#1a365d',
    tagline: 'Premier Beachside Luxury in New Digha',
    roomTypes: [
      { name: 'Standard Room', defaultRent: 1500 },
      { name: 'Deluxe Room', defaultRent: 2200 },
      { name: 'Super Deluxe Room', defaultRent: 3000 },
      { name: 'Suite Room', defaultRent: 4500 }
    ],
    signatureImage: 'manager-sign.png',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    hotelId: 'hotel-2',
    name: 'Hotel Sagar Priya',
    subText: 'A Unit of Sagar Hospitality & Resorts',
    address: 'Old Digha, Near Sea Beach Road, Purba Medinipur, W.B.',
    phone: '9832104567',
    gstin: '19AAACH1234F1Z5',
    managerPin: '2222',
    managerUsername: 'hotel2',
    managerPassword: 'hotel2345',
    themeColor: '#065f46',
    tagline: 'Oceanfront Elegance & Serenity',
    roomTypes: [
      { name: 'Economy AC Room', defaultRent: 1400 },
      { name: 'Premium Sea View', defaultRent: 2600 },
      { name: 'Executive Deluxe', defaultRent: 3500 },
      { name: 'Family Suite (4 Bed)', defaultRent: 5000 }
    ],
    signatureImage: 'manager-sign.png',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    hotelId: 'hotel-3',
    name: 'Hotel Sea Pearl',
    subText: 'Managed by Tara Holidays Group',
    address: 'Foreshore Road, Mini Holiday Sector, Digha, W.B.',
    phone: '9733445566',
    gstin: '19BBYPS5678K1Z2',
    managerPin: '3333',
    managerUsername: 'hotel3',
    managerPassword: 'hotel3456',
    themeColor: '#4338ca',
    tagline: 'Modern Hospitality with Coastal Charm',
    roomTypes: [
      { name: 'Standard Non-AC', defaultRent: 1200 },
      { name: 'Deluxe AC Room', defaultRent: 2400 },
      { name: 'Super Deluxe AC', defaultRent: 3200 },
      { name: 'Royal Suite Room', defaultRent: 4800 }
    ],
    signatureImage: 'manager-sign.png',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// Default initial rooms data (Floor by Floor)
const defaultRooms = [
  // Hotel 1: Hotel Rojana
  { roomId: 'hotel-1-101', hotelId: 'hotel-1', roomNumber: '101', floor: 1, roomType: 'Standard Room', defaultRent: 1500, status: 'available' },
  { roomId: 'hotel-1-102', hotelId: 'hotel-1', roomNumber: '102', floor: 1, roomType: 'Standard Room', defaultRent: 1500, status: 'available' },
  { roomId: 'hotel-1-103', hotelId: 'hotel-1', roomNumber: '103', floor: 1, roomType: 'Deluxe Room', defaultRent: 2200, status: 'available' },
  { roomId: 'hotel-1-104', hotelId: 'hotel-1', roomNumber: '104', floor: 1, roomType: 'Deluxe Room', defaultRent: 2200, status: 'available' },
  { roomId: 'hotel-1-105', hotelId: 'hotel-1', roomNumber: '105', floor: 1, roomType: 'Suite Room', defaultRent: 4500, status: 'available' },

  { roomId: 'hotel-1-201', hotelId: 'hotel-1', roomNumber: '201', floor: 2, roomType: 'Deluxe Room', defaultRent: 2200, status: 'available' },
  { roomId: 'hotel-1-202', hotelId: 'hotel-1', roomNumber: '202', floor: 2, roomType: 'Deluxe Room', defaultRent: 2200, status: 'available' },
  { roomId: 'hotel-1-203', hotelId: 'hotel-1', roomNumber: '203', floor: 2, roomType: 'Super Deluxe Room', defaultRent: 3000, status: 'available' },
  { roomId: 'hotel-1-204', hotelId: 'hotel-1', roomNumber: '204', floor: 2, roomType: 'Super Deluxe Room', defaultRent: 3000, status: 'available' },
  { roomId: 'hotel-1-205', hotelId: 'hotel-1', roomNumber: '205', floor: 2, roomType: 'Suite Room', defaultRent: 4500, status: 'available' },

  { roomId: 'hotel-1-301', hotelId: 'hotel-1', roomNumber: '301', floor: 3, roomType: 'Deluxe Room', defaultRent: 2200, status: 'available' },
  { roomId: 'hotel-1-302', hotelId: 'hotel-1', roomNumber: '302', floor: 3, roomType: 'Super Deluxe Room', defaultRent: 3000, status: 'available' },
  { roomId: 'hotel-1-303', hotelId: 'hotel-1', roomNumber: '303', floor: 3, roomType: 'Super Deluxe Room', defaultRent: 3000, status: 'available' },
  { roomId: 'hotel-1-304', hotelId: 'hotel-1', roomNumber: '304', floor: 3, roomType: 'Suite Room', defaultRent: 4500, status: 'available' },
  { roomId: 'hotel-1-305', hotelId: 'hotel-1', roomNumber: '305', floor: 3, roomType: 'Suite Room', defaultRent: 4500, status: 'available' },

  // Hotel 2: Hotel Sagar Priya
  { roomId: 'hotel-2-101', hotelId: 'hotel-2', roomNumber: '101', floor: 1, roomType: 'Economy AC Room', defaultRent: 1400, status: 'available' },
  { roomId: 'hotel-2-102', hotelId: 'hotel-2', roomNumber: '102', floor: 1, roomType: 'Economy AC Room', defaultRent: 1400, status: 'available' },
  { roomId: 'hotel-2-108', hotelId: 'hotel-2', roomNumber: '108', floor: 1, roomType: 'Premium Sea View', defaultRent: 2600, status: 'available' },
  { roomId: 'hotel-2-201', hotelId: 'hotel-2', roomNumber: '201', floor: 2, roomType: 'Premium Sea View', defaultRent: 2600, status: 'available' },
  { roomId: 'hotel-2-215', hotelId: 'hotel-2', roomNumber: '215', floor: 2, roomType: 'Executive Deluxe', defaultRent: 3500, status: 'available' },
  { roomId: 'hotel-2-301', hotelId: 'hotel-2', roomNumber: '301', floor: 3, roomType: 'Family Suite (4 Bed)', defaultRent: 5000, status: 'available' },

  // Hotel 3: Hotel Sea Pearl
  { roomId: 'hotel-3-101', hotelId: 'hotel-3', roomNumber: '101', floor: 1, roomType: 'Standard Non-AC', defaultRent: 1200, status: 'available' },
  { roomId: 'hotel-3-201', hotelId: 'hotel-3', roomNumber: '201', floor: 2, roomType: 'Deluxe AC Room', defaultRent: 2400, status: 'available' },
  { roomId: 'hotel-3-305', hotelId: 'hotel-3', roomNumber: '305', floor: 3, roomType: 'Deluxe AC Room', defaultRent: 2400, status: 'available' }
];

// Default initial advance bookings (Clean for production)
const defaultAdvanceBookings = [];

// Helper functions for JSON storage
function readJSON(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return fallback;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
  }
}

// Initialize seed data if not present
function initializeData() {
  if (!fs.existsSync(HOTELS_FILE)) {
    writeJSON(HOTELS_FILE, defaultHotels);
  }
  if (!fs.existsSync(BILLS_FILE)) {
    writeJSON(BILLS_FILE, []);
  }
  if (!fs.existsSync(ROOMS_FILE)) {
    writeJSON(ROOMS_FILE, defaultRooms);
  }
  if (!fs.existsSync(BOOKINGS_FILE)) {
    writeJSON(BOOKINGS_FILE, defaultAdvanceBookings);
  }
}

initializeData();

// Attempt MongoDB Connection
async function connectDB() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotel_billing_db';
  const safeURI = mongoURI.replace(/:([^:@]+)@/, ':****@');
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000
    });
    isMongoConnected = true;
    console.log(`[DB] ✓ Successfully connected to MongoDB Atlas database: ${safeURI}`);

    // Seed default hotels to MongoDB if collection is empty
    try {
      const Hotel = require('./models/Hotel');
      const hotelCount = await Hotel.countDocuments();
      if (hotelCount === 0) {
        console.log('[DB] Seeding initial hotels to MongoDB Atlas...');
        await Hotel.insertMany(defaultHotels);
        console.log('[DB] Initial hotels seeded to Atlas.');
      } else {
        // Backfill managerUsername and managerPassword for existing documents
        for (const def of defaultHotels) {
          await Hotel.updateOne(
            { hotelId: def.hotelId, $or: [{ managerUsername: { $exists: false } }, { managerUsername: '' }] },
            { $set: { managerUsername: def.managerUsername, managerPassword: def.managerPassword } }
          );
        }
      }

      // Seed default rooms to MongoDB if collection is empty
      const Room = require('./models/Room');
      const roomCount = await Room.countDocuments();
      if (roomCount === 0) {
        console.log('[DB] Seeding initial rooms to MongoDB Atlas...');
        await Room.insertMany(defaultRooms);
        console.log('[DB] Initial rooms seeded to Atlas.');
      }

      // Seed default advance bookings to MongoDB if empty
      const AdvanceBooking = require('./models/AdvanceBooking');
      const bookingCount = await AdvanceBooking.countDocuments();
      if (bookingCount === 0 && defaultAdvanceBookings.length > 0) {
        console.log('[DB] Seeding initial advance bookings to MongoDB Atlas...');
        await AdvanceBooking.insertMany(defaultAdvanceBookings);
        console.log('[DB] Initial advance bookings seeded to Atlas.');
      }
    } catch (seedErr) {
      console.warn('[DB] Seed check notice:', seedErr.message);
    }
  } catch (err) {
    isMongoConnected = false;
    console.log(`[DB] Notice: MongoDB connection failed (${err.message}).`);
    console.log(`[DB] Using resilient local file storage engine at: ${DATA_DIR}`);
  }
}

// Unified DAO (Data Access Object)
const db = {
  isMongo: () => isMongoConnected,

  // Hotels Operations
  async getHotels() {
    if (isMongoConnected) {
      const Hotel = require('./models/Hotel');
      const hotels = await Hotel.find({ isActive: true });
      if (hotels && hotels.length > 0) return hotels;
    }
    return readJSON(HOTELS_FILE, defaultHotels);
  },

  async getHotelById(hotelId) {
    if (isMongoConnected) {
      const Hotel = require('./models/Hotel');
      const hotel = await Hotel.findOne({ hotelId });
      if (hotel) return hotel;
    }
    const hotels = readJSON(HOTELS_FILE, defaultHotels);
    return hotels.find(h => h.hotelId === hotelId) || null;
  },

  async getHotelByUsername(username) {
    if (!username) return null;
    const cleanUser = String(username).trim();
    if (isMongoConnected) {
      const Hotel = require('./models/Hotel');
      const hotel = await Hotel.findOne({
        managerUsername: { $regex: new RegExp(`^${cleanUser}$`, 'i') },
        isActive: true
      });
      if (hotel) return hotel;
    }
    const hotels = readJSON(HOTELS_FILE, defaultHotels);
    return hotels.find(h => h.managerUsername && h.managerUsername.toLowerCase() === cleanUser.toLowerCase()) || null;
  },

  async updateHotelCredentials(hotelId, managerUsername, managerPassword) {
    let result = null;
    const cleanUser = String(managerUsername).trim();
    const cleanPass = String(managerPassword).trim();

    if (isMongoConnected) {
      const Hotel = require('./models/Hotel');
      result = await Hotel.findOneAndUpdate(
        { hotelId },
        { managerUsername: cleanUser, managerPassword: cleanPass, updatedAt: new Date() },
        { new: true }
      );
    }
    const hotels = readJSON(HOTELS_FILE, defaultHotels);
    const hotel = hotels.find(h => h.hotelId === hotelId);
    if (hotel) {
      hotel.managerUsername = cleanUser;
      hotel.managerPassword = cleanPass;
      hotel.updatedAt = new Date().toISOString();
      writeJSON(HOTELS_FILE, hotels);
      if (!result) result = hotel;
    }
    return result;
  },

  async updateHotelPin(hotelId, newPin) {
    let result = null;
    if (isMongoConnected) {
      const Hotel = require('./models/Hotel');
      result = await Hotel.findOneAndUpdate({ hotelId }, { managerPin: newPin, updatedAt: new Date() }, { new: true });
    }
    const hotels = readJSON(HOTELS_FILE, defaultHotels);
    const hotel = hotels.find(h => h.hotelId === hotelId);
    if (hotel) {
      hotel.managerPin = newPin;
      hotel.updatedAt = new Date().toISOString();
      writeJSON(HOTELS_FILE, hotels);
      if (!result) result = hotel;
    }
    return result;
  },

  async updateHotelDetails(hotelId, updateData) {
    let result = null;
    if (isMongoConnected) {
      const Hotel = require('./models/Hotel');
      result = await Hotel.findOneAndUpdate({ hotelId }, { ...updateData, updatedAt: new Date() }, { new: true });
    }
    const hotels = readJSON(HOTELS_FILE, defaultHotels);
    const index = hotels.findIndex(h => h.hotelId === hotelId);
    if (index !== -1) {
      hotels[index] = { ...hotels[index], ...updateData, updatedAt: new Date().toISOString() };
      writeJSON(HOTELS_FILE, hotels);
      if (!result) result = hotels[index];
    }
    return result;
  },

  // Bills Operations
  async getBills(filter = {}) {
    let bills = [];
    if (isMongoConnected) {
      const Bill = require('./models/Bill');
      const query = {};
      if (filter.hotelId && filter.hotelId !== 'all') query.hotelId = filter.hotelId;
      if (filter.paymentMode && filter.paymentMode !== 'all') query.paymentMode = new RegExp(filter.paymentMode, 'i');
      if (filter.paymentStatus && filter.paymentStatus !== 'all') query.paymentStatus = filter.paymentStatus;
      if (filter.startDate || filter.endDate) {
        query.billDateTime = {};
        if (filter.startDate) query.billDateTime.$gte = new Date(filter.startDate);
        if (filter.endDate) {
          const end = new Date(filter.endDate);
          end.setHours(23, 59, 59, 999);
          query.billDateTime.$lte = end;
        }
      }
      bills = await Bill.find(query).sort({ billDateTime: -1, createdAt: -1 });
      return bills;
    }

    bills = readJSON(BILLS_FILE, []);
    if (filter.hotelId && filter.hotelId !== 'all') {
      bills = bills.filter(b => b.hotelId === filter.hotelId);
    }
    if (filter.paymentMode && filter.paymentMode !== 'all') {
      bills = bills.filter(b => b.paymentMode && b.paymentMode.toLowerCase().includes(filter.paymentMode.toLowerCase()));
    }
    if (filter.paymentStatus && filter.paymentStatus !== 'all') {
      bills = bills.filter(b => b.paymentStatus === filter.paymentStatus);
    }
    if (filter.startDate) {
      const start = new Date(filter.startDate);
      bills = bills.filter(b => new Date(b.billDateTime || b.createdAt) >= start);
    }
    if (filter.endDate) {
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
      bills = bills.filter(b => new Date(b.billDateTime || b.createdAt) <= end);
    }

    // Sort descending by date
    bills.sort((a, b) => new Date(b.billDateTime || b.createdAt) - new Date(a.billDateTime || a.createdAt));
    return bills;
  },

  async createBill(billData) {
    billData.id = 'bill-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    billData.createdAt = new Date().toISOString();
    billData.billDateTime = billData.billDateTime ? new Date(billData.billDateTime).toISOString() : new Date().toISOString();

    let createdBill = billData;
    if (isMongoConnected) {
      const Bill = require('./models/Bill');
      const newBill = new Bill(billData);
      createdBill = await newBill.save();
    }

    // Mirror to local JSON for resilient offline backup
    const bills = readJSON(BILLS_FILE, []);
    bills.unshift(billData);
    writeJSON(BILLS_FILE, bills);
    return createdBill;
  },

  async getBillById(id) {
    if (isMongoConnected) {
      const Bill = require('./models/Bill');
      if (mongoose.Types.ObjectId.isValid(id)) {
        const doc = await Bill.findById(id);
        if (doc) return doc;
      }
      return await Bill.findOne({ $or: [{ id: id }, { invoiceNo: id }] });
    }
    const bills = readJSON(BILLS_FILE, []);
    return bills.find(b => b.id === id || b._id === id || b.invoiceNo === id) || null;
  },

  async deleteBill(id) {
    if (isMongoConnected) {
      const Bill = require('./models/Bill');
      if (mongoose.Types.ObjectId.isValid(id)) {
        await Bill.findByIdAndDelete(id);
      } else {
        await Bill.findOneAndDelete({ $or: [{ id: id }, { invoiceNo: id }] });
      }
    }
    let bills = readJSON(BILLS_FILE, []);
    const initialLen = bills.length;
    bills = bills.filter(b => b.id !== id && b._id !== id && b.invoiceNo !== id);
    writeJSON(BILLS_FILE, bills);
    return bills.length < initialLen;
  },

  async updateBill(id, updateData) {
    let result = null;
    if (isMongoConnected) {
      const Bill = require('./models/Bill');
      if (mongoose.Types.ObjectId.isValid(id)) {
        result = await Bill.findByIdAndUpdate(id, { ...updateData, updatedAt: new Date() }, { new: true });
      }
      if (!result) {
        result = await Bill.findOneAndUpdate({ $or: [{ invoiceNo: id }, { id: id }] }, { ...updateData, updatedAt: new Date() }, { new: true });
      }
    }
    const bills = readJSON(BILLS_FILE, []);
    const index = bills.findIndex(b => b.id === id || b._id === id || b.invoiceNo === id);
    if (index !== -1) {
      bills[index] = { ...bills[index], ...updateData, updatedAt: new Date().toISOString() };
      writeJSON(BILLS_FILE, bills);
      if (!result) result = bills[index];
    }
    return result;
  },

  async checkoutBill(id) {
    const bill = await db.getBillById(id);
    if (!bill) return null;

    const checkedOutAt = new Date().toISOString();
    const updated = await db.updateBill(id, {
      billStatus: 'CLOSED',
      paymentStatus: 'PAID',
      balanceDue: 0,
      checkedOutAt
    });

    // Start 30-min housekeeping cycle on room(s)
    if (bill.hotelId) {
      await db.checkoutRoom(bill.hotelId, bill.roomNumber, bill.id || bill._id || id, bill.invoiceNo);
    }

    return updated;
  },

  // Rooms Operations
  async getRooms(hotelId, targetDateStr = null) {
    const todayStr = targetDateStr || getISTDateStr();
    const now = new Date();

    let rooms = [];
    if (isMongoConnected) {
      const Room = require('./models/Room');
      rooms = await Room.find({ hotelId });
      if (!rooms || rooms.length === 0) {
        const hotelRooms = defaultRooms.filter(r => r.hotelId === hotelId);
        if (hotelRooms.length > 0) {
          await Room.insertMany(hotelRooms);
          rooms = await Room.find({ hotelId });
        }
      }
    } else {
      rooms = readJSON(ROOMS_FILE, defaultRooms).filter(r => r.hotelId === hotelId);
    }

    // Get advance bookings for today/target date
    const bookings = await db.getAdvanceBookings(hotelId);
    const todayBookingsMap = {};
    bookings.forEach(b => {
      if (b.status === 'RESERVED' && b.roomNumber && b.checkInDate === todayStr) {
        todayBookingsMap[b.roomNumber] = b;
      }
    });

    // Check maintenance timer & map display statuses
    const updatedRooms = rooms.map(r => {
      const rObj = r.toObject ? r.toObject() : { ...r };

      // 1. Check if 30-minute maintenance expired
      if (rObj.status === 'maintenance') {
        if (rObj.maintenanceUntil && now >= new Date(rObj.maintenanceUntil)) {
          rObj.status = 'available';
          rObj.maintenanceUntil = null;
          // Async update
          db.updateRoomStatus(hotelId, rObj.roomNumber, 'available', 0);
        }
      }

      // 2. Compute live color flag (Green, Red, Yellow, Grey)
      if (rObj.status === 'occupied') {
        rObj.displayStatus = 'occupied'; // Red
      } else if (rObj.status === 'maintenance') {
        rObj.displayStatus = 'maintenance'; // Grey
      } else if (todayBookingsMap[rObj.roomNumber]) {
        rObj.displayStatus = 'reserved'; // Yellow (Advance Booked arriving today)
        rObj.advanceBooking = todayBookingsMap[rObj.roomNumber];
      } else {
        rObj.displayStatus = 'available'; // Green
      }

      // Compute remaining maintenance minutes if applicable
      if (rObj.status === 'maintenance' && rObj.maintenanceUntil) {
        const diffMs = new Date(rObj.maintenanceUntil) - now;
        rObj.maintenanceRemainingMins = Math.max(0, Math.ceil(diffMs / (60 * 1000)));
      } else {
        rObj.maintenanceRemainingMins = 0;
      }

      return rObj;
    });

    // Sort by floor ascending, then roomNumber
    updatedRooms.sort((a, b) => {
      if (a.floor !== b.floor) return a.floor - b.floor;
      return String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, { numeric: true });
    });

    return updatedRooms;
  },

  async updateRoomStatus(hotelId, roomNumber, status, maintenanceMinutes = 0) {
    const maintenanceUntil = (status === 'maintenance' && maintenanceMinutes > 0)
      ? new Date(Date.now() + maintenanceMinutes * 60 * 1000)
      : null;

    if (isMongoConnected) {
      const Room = require('./models/Room');
      await Room.findOneAndUpdate(
        { hotelId, roomNumber },
        { status, maintenanceUntil, updatedAt: new Date() },
        { new: true }
      );
    }
    const allRooms = readJSON(ROOMS_FILE, defaultRooms);
    const index = allRooms.findIndex(r => r.hotelId === hotelId && r.roomNumber === roomNumber);
    if (index !== -1) {
      allRooms[index].status = status;
      allRooms[index].maintenanceUntil = maintenanceUntil;
      allRooms[index].updatedAt = new Date().toISOString();
      writeJSON(ROOMS_FILE, allRooms);
    }
  },

  async checkoutRoom(hotelId, roomNumber, billId = null, invoiceNo = null) {
    const roomNums = roomNumber ? String(roomNumber).split(',').map(s => s.trim()).filter(Boolean) : [];
    const maintenanceUntil = new Date(Date.now() + 30 * 60 * 1000);

    if (isMongoConnected) {
      const Room = require('./models/Room');
      const orConditions = [];
      if (roomNums.length > 0) {
        orConditions.push({ roomNumber: { $in: roomNums } });
      }
      if (billId) {
        orConditions.push({ currentBillId: String(billId) });
      }
      if (invoiceNo) {
        orConditions.push({ currentInvoiceNo: String(invoiceNo) });
      }

      if (orConditions.length > 0) {
        await Room.updateMany(
          { hotelId, $or: orConditions },
          { 
            $set: {
              status: 'maintenance', 
              maintenanceUntil, 
              currentGuestName: '', 
              currentGuestPhone: '',
              currentBillId: '', 
              currentInvoiceNo: '',
              checkInDateTime: '',
              expectedCheckOutDateTime: '',
              updatedAt: new Date() 
            }
          }
        );
      }
    }

    // Local JSON fallback
    const allRooms = readJSON(ROOMS_FILE, defaultRooms);
    let changed = false;
    allRooms.forEach(r => {
      if (r.hotelId === hotelId) {
        const matchesRoom = roomNums.includes(r.roomNumber);
        const matchesBill = (billId && String(r.currentBillId) === String(billId)) || (invoiceNo && String(r.currentInvoiceNo) === String(invoiceNo));
        if (matchesRoom || matchesBill) {
          r.status = 'maintenance';
          r.maintenanceUntil = maintenanceUntil;
          r.currentGuestName = '';
          r.currentBillId = '';
          r.currentInvoiceNo = '';
          changed = true;
        }
      }
    });
    if (changed) {
      writeJSON(ROOMS_FILE, allRooms);
    }
  },

  async assignRoom(hotelId, roomNumber, guestName, billId, invoiceNo, checkInDateTime = '', expectedCheckOutDateTime = '') {
    if (!roomNumber) return;
    const roomNums = String(roomNumber).split(',').map(s => s.trim()).filter(Boolean);

    // 1. Release any room previously tied to this bill/invoice that is NO LONGER in roomNums (e.g. room changed during bill edit)
    if (billId || invoiceNo) {
      const billIdStr = billId ? String(billId) : null;
      const invStr = invoiceNo ? String(invoiceNo) : null;

      if (isMongoConnected) {
        const Room = require('./models/Room');
        const conditions = [];
        if (billIdStr) conditions.push({ currentBillId: billIdStr });
        if (invStr) conditions.push({ currentInvoiceNo: invStr });

        if (conditions.length > 0) {
          await Room.updateMany(
            {
              hotelId,
              $or: conditions,
              roomNumber: { $nin: roomNums }
            },
            {
              $set: {
                status: 'available',
                currentGuestName: '',
                currentGuestPhone: '',
                currentBillId: '',
                currentInvoiceNo: '',
                checkInDateTime: '',
                expectedCheckOutDateTime: '',
                maintenanceUntil: null,
                updatedAt: new Date()
              }
            }
          );
        }
      }

      // Local JSON fallback
      const allRooms = readJSON(ROOMS_FILE, defaultRooms);
      let changed = false;
      allRooms.forEach(r => {
        if (r.hotelId === hotelId && !roomNums.includes(r.roomNumber)) {
          const wasThisBill = (billIdStr && String(r.currentBillId) === billIdStr) || (invStr && String(r.currentInvoiceNo) === invStr);
          if (wasThisBill) {
            r.status = 'available';
            r.currentGuestName = '';
            r.currentBillId = '';
            r.currentInvoiceNo = '';
            r.checkInDateTime = '';
            r.expectedCheckOutDateTime = '';
            r.maintenanceUntil = null;
            changed = true;
          }
        }
      });
      if (changed) {
        writeJSON(ROOMS_FILE, allRooms);
      }
    }

    // 2. Assign the active rooms
    for (const rm of roomNums) {
      if (isMongoConnected) {
        const Room = require('./models/Room');
        await Room.findOneAndUpdate(
          { hotelId, roomNumber: rm },
          {
            status: 'occupied',
            maintenanceUntil: null,
            currentGuestName: guestName,
            currentBillId: billId,
            currentInvoiceNo: invoiceNo,
            checkInDateTime,
            expectedCheckOutDateTime,
            updatedAt: new Date()
          }
        );
      }
      const allRooms = readJSON(ROOMS_FILE, defaultRooms);
      const index = allRooms.findIndex(r => r.hotelId === hotelId && r.roomNumber === rm);
      if (index !== -1) {
        allRooms[index].status = 'occupied';
        allRooms[index].maintenanceUntil = null;
        allRooms[index].currentGuestName = guestName;
        allRooms[index].currentBillId = billId;
        allRooms[index].currentInvoiceNo = invoiceNo;
        writeJSON(ROOMS_FILE, allRooms);
      }
    }
  },

  async addRoomIssue(hotelId, roomNumber, issueText, reportedBy = 'Manager') {
    const newIssue = {
      id: 'iss-' + Date.now(),
      issue: issueText,
      reportedAt: new Date(),
      reportedBy,
      isFixed: false
    };
    if (isMongoConnected) {
      const Room = require('./models/Room');
      await Room.findOneAndUpdate(
        { hotelId, roomNumber },
        { $push: { activeIssues: newIssue } }
      );
    }
    const allRooms = readJSON(ROOMS_FILE, defaultRooms);
    const index = allRooms.findIndex(r => r.hotelId === hotelId && r.roomNumber === roomNumber);
    if (index !== -1) {
      if (!allRooms[index].activeIssues) allRooms[index].activeIssues = [];
      allRooms[index].activeIssues.push(newIssue);
      writeJSON(ROOMS_FILE, allRooms);
    }
    return newIssue;
  },

  async fixRoomIssue(hotelId, roomNumber, issueId = null) {
    if (isMongoConnected) {
      const Room = require('./models/Room');
      if (issueId) {
        await Room.findOneAndUpdate(
          { hotelId, roomNumber },
          { $pull: { activeIssues: { id: issueId } } }
        );
      } else {
        await Room.findOneAndUpdate(
          { hotelId, roomNumber },
          { $set: { activeIssues: [] } }
        );
      }
    }
    const allRooms = readJSON(ROOMS_FILE, defaultRooms);
    const index = allRooms.findIndex(r => r.hotelId === hotelId && r.roomNumber === roomNumber);
    if (index !== -1) {
      if (issueId && allRooms[index].activeIssues) {
        allRooms[index].activeIssues = allRooms[index].activeIssues.filter(i => i.id !== issueId);
      } else {
        allRooms[index].activeIssues = [];
      }
      writeJSON(ROOMS_FILE, allRooms);
    }
  },

  async getAllRoomIssues(hotelId = null) {
    let allRooms = [];
    if (isMongoConnected) {
      const Room = require('./models/Room');
      allRooms = await Room.find(hotelId && hotelId !== 'all' ? { hotelId } : {});
    } else {
      allRooms = readJSON(ROOMS_FILE, defaultRooms);
      if (hotelId && hotelId !== 'all') {
        allRooms = allRooms.filter(r => r.hotelId === hotelId);
      }
    }

    const issues = [];
    const hotelNames = {
      'hotel-1': 'Hotel Rojana',
      'hotel-2': 'Hotel Sagar Priya',
      'hotel-3': 'Hotel Sea Pearl'
    };

    allRooms.forEach(r => {
      const rObj = r.toObject ? r.toObject() : r;
      if (rObj.activeIssues && rObj.activeIssues.length > 0) {
        rObj.activeIssues.forEach(iss => {
          issues.push({
            ...iss,
            roomNumber: rObj.roomNumber,
            roomType: rObj.roomType,
            floor: rObj.floor,
            hotelId: rObj.hotelId,
            hotelName: hotelNames[rObj.hotelId] || rObj.hotelId
          });
        });
      }
    });

    return issues;
  },

  async addRoom(roomData) {
    const { hotelId, roomNumber, floor, roomType, defaultRent, pricePerDay } = roomData;
    const cleanRoomNum = String(roomNumber).trim();
    const roomId = `${hotelId}-${cleanRoomNum}`;
    const rent = defaultRent !== undefined ? defaultRent : pricePerDay;

    if (isMongoConnected) {
      const Room = require('./models/Room');
      const existing = await Room.findOne({ hotelId, roomNumber: cleanRoomNum });
      if (existing) {
        throw new Error(`Room ${cleanRoomNum} already exists in this property.`);
      }
      return await Room.create({
        roomId,
        hotelId,
        roomNumber: cleanRoomNum,
        floor: parseInt(floor) || 1,
        roomType,
        defaultRent: parseFloat(rent) || 1500,
        status: 'available',
        activeIssues: []
      });
    }

    const allRooms = readJSON(ROOMS_FILE, defaultRooms);
    if (allRooms.some(r => r.hotelId === hotelId && r.roomNumber === cleanRoomNum)) {
      throw new Error(`Room ${cleanRoomNum} already exists in this property.`);
    }
    const newRoom = {
      roomId,
      hotelId,
      roomNumber: cleanRoomNum,
      floor: parseInt(floor) || 1,
      roomType,
      defaultRent: parseFloat(rent) || 1500,
      status: 'available',
      activeIssues: []
    };
    allRooms.push(newRoom);
    writeJSON(ROOMS_FILE, allRooms);
    return newRoom;
  },

  async updateRoomTariff(hotelId, roomNumber, updateData) {
    const { roomType, defaultRent, pricePerDay, floor } = updateData;
    const cleanRoomNum = String(roomNumber).trim();
    const rent = defaultRent !== undefined ? defaultRent : pricePerDay;

    if (isMongoConnected) {
      const Room = require('./models/Room');
      const updated = await Room.findOneAndUpdate(
        { hotelId, roomNumber: cleanRoomNum },
        {
          $set: {
            ...(roomType ? { roomType } : {}),
            ...(rent !== undefined ? { defaultRent: parseFloat(rent) } : {}),
            ...(floor !== undefined ? { floor: parseInt(floor) } : {})
          }
        },
        { new: true }
      );
      if (!updated) throw new Error(`Room ${cleanRoomNum} not found.`);
      return updated;
    }

    const allRooms = readJSON(ROOMS_FILE, defaultRooms);
    const idx = allRooms.findIndex(r => r.hotelId === hotelId && r.roomNumber === cleanRoomNum);
    if (idx === -1) throw new Error(`Room ${cleanRoomNum} not found.`);
    if (roomType) allRooms[idx].roomType = roomType;
    if (rent !== undefined) allRooms[idx].defaultRent = parseFloat(rent);
    if (floor !== undefined) allRooms[idx].floor = parseInt(floor);
    allRooms[idx].updatedAt = new Date().toISOString();
    writeJSON(ROOMS_FILE, allRooms);
    return allRooms[idx];
  },

  async deleteRoom(hotelId, roomNumber) {
    const cleanRoomNum = String(roomNumber).trim();

    if (isMongoConnected) {
      const Room = require('./models/Room');
      const r = await Room.findOne({ hotelId, roomNumber: cleanRoomNum });
      if (!r) throw new Error(`Room ${cleanRoomNum} not found.`);
      if (r.status === 'occupied') {
        throw new Error(`Cannot delete Room ${cleanRoomNum} while it is occupied.`);
      }
      await Room.deleteOne({ hotelId, roomNumber: cleanRoomNum });
      return true;
    }

    const allRooms = readJSON(ROOMS_FILE, defaultRooms);
    const idx = allRooms.findIndex(r => r.hotelId === hotelId && r.roomNumber === cleanRoomNum);
    if (idx === -1) throw new Error(`Room ${cleanRoomNum} not found.`);
    if (allRooms[idx].status === 'occupied') {
      throw new Error(`Cannot delete Room ${cleanRoomNum} while it is occupied.`);
    }
    allRooms.splice(idx, 1);
    writeJSON(ROOMS_FILE, allRooms);
    return true;
  },

  // Advance Bookings Operations
  async getAdvanceBookings(hotelId) {
    const filter = (hotelId && hotelId !== 'all') ? { hotelId } : {};
    if (isMongoConnected) {
      const AdvanceBooking = require('./models/AdvanceBooking');
      return await AdvanceBooking.find(filter).sort({ checkInDate: 1 });
    }
    const allBookings = readJSON(BOOKINGS_FILE, defaultAdvanceBookings);
    return (hotelId && hotelId !== 'all') ? allBookings.filter(b => b.hotelId === hotelId) : allBookings;
  },

  async createAdvanceBooking(bookingData) {
    bookingData.bookingId = 'ADV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    bookingData.createdAt = new Date().toISOString();
    bookingData.status = 'RESERVED';

    if (isMongoConnected) {
      const AdvanceBooking = require('./models/AdvanceBooking');
      const b = new AdvanceBooking(bookingData);
      await b.save();
    }
    const allBookings = readJSON(BOOKINGS_FILE, defaultAdvanceBookings);
    allBookings.unshift(bookingData);
    writeJSON(BOOKINGS_FILE, allBookings);
    return bookingData;
  },

  async updateAdvanceBooking(bookingId, updateData) {
    if (isMongoConnected) {
      const AdvanceBooking = require('./models/AdvanceBooking');
      await AdvanceBooking.findOneAndUpdate({ bookingId }, { ...updateData, updatedAt: new Date() });
    }
    const allBookings = readJSON(BOOKINGS_FILE, defaultAdvanceBookings);
    const index = allBookings.findIndex(b => b.bookingId === bookingId);
    if (index !== -1) {
      allBookings[index] = { ...allBookings[index], ...updateData, updatedAt: new Date().toISOString() };
      writeJSON(BOOKINGS_FILE, allBookings);
    }
  },

  // Today Activity Operations
  async getTodayActivity(hotelId) {
    const todayStr = getISTDateStr();
    const rooms = await db.getRooms(hotelId, todayStr);
    const bills = await db.getBills({ hotelId });
    const advanceBookings = await db.getAdvanceBookings(hotelId);

    // Active (Occupied) rooms
    const occupiedRooms = rooms.filter(r => r.displayStatus === 'occupied');
    const availableRooms = rooms.filter(r => r.displayStatus === 'available');
    const reservedRooms = rooms.filter(r => r.displayStatus === 'reserved');
    const maintenanceRooms = rooms.filter(r => r.displayStatus === 'maintenance');

    // Today's Check-ins (measured strictly by 12:00 AM IST business day)
    const todayCheckIns = bills.filter(b => {
      const rawDate = b.billDateTime || b.createdAt;
      if (!rawDate) return false;
      try {
        return getISTDateStr(rawDate) === todayStr;
      } catch {
        return false;
      }
    });

    // Today's Revenue
    let todayRevenue = 0;
    todayCheckIns.forEach(b => {
      todayRevenue += (parseFloat(b.advancePaid) || parseFloat(b.netTotal) || 0);
    });

    // Today's Expected Arrivals (from Advance Bookings)
    const todayArrivals = advanceBookings.filter(b => b.checkInDate === todayStr && b.status === 'RESERVED');

    // =========================================================
    // REVENUE & DAILY SETTLEMENT (MANAGER VIEW)
    // 1. Pending Balances: Total uncollected amount across all currently checked-in guests
    // 2. Today's Collections: Breakdown by Cash vs. UPI vs. Card
    // =========================================================
    const activeBills = bills.filter(b => b.billStatus === 'SAVED');
    let pendingBalanceTotal = 0;
    let pendingGuestsCount = 0;
    const pendingGuestsList = [];

    activeBills.forEach(b => {
      const net = parseFloat(b.netTotal) || 0;
      const adv = parseFloat(b.advancePaid) || 0;
      const balance = Math.max(0, net - adv);
      if (balance > 0) {
        pendingBalanceTotal += balance;
        pendingGuestsCount += 1;
        pendingGuestsList.push({
          invoiceNo: b.invoiceNo,
          roomNumber: b.roomNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          netTotal: net,
          advancePaid: adv,
          balanceDue: balance
        });
      }
    });

    let cashCollection = 0;
    let upiCollection = 0;
    let cardCollection = 0;
    let otherCollection = 0;

    // A. Closed Bills finalized today (Full settlement upon checkout - strictly 12:00 AM IST)
    const closedToday = bills.filter(b => {
      if (b.billStatus !== 'CLOSED') return false;
      const rawDt = b.checkedOutAt || b.billDateTime || b.createdAt;
      try {
        return getISTDateStr(rawDt) === todayStr;
      } catch {
        return false;
      }
    });

    closedToday.forEach(b => {
      const amount = parseFloat(b.netTotal) || 0;
      const mode = (b.paymentMode || '').toUpperCase();
      if (mode.includes('CASH')) {
        cashCollection += amount;
      } else if (mode.includes('UPI') || mode.includes('QR')) {
        upiCollection += amount;
      } else if (mode.includes('CARD') || mode.includes('DEBIT') || mode.includes('CREDIT')) {
        cardCollection += amount;
      } else {
        otherCollection += amount;
      }
    });

    // B. Active In-House Bills created today (Advance deposits collected at check-in)
    todayCheckIns.forEach(b => {
      if (b.billStatus !== 'CLOSED') {
        const adv = parseFloat(b.advancePaid) || 0;
        if (adv > 0) {
          const mode = (b.paymentMode || '').toUpperCase();
          if (mode.includes('CASH')) {
            cashCollection += adv;
          } else if (mode.includes('UPI') || mode.includes('QR')) {
            upiCollection += adv;
          } else if (mode.includes('CARD') || mode.includes('DEBIT') || mode.includes('CREDIT')) {
            cardCollection += adv;
          } else {
            otherCollection += adv;
          }
        }
      }
    });

    // C. Advance Bookings created today (Advance deposits collected in advance - strictly 12:00 AM IST)
    const advBookingsToday = advanceBookings.filter(ab => {
      try {
        return getISTDateStr(ab.createdAt) === todayStr;
      } catch {
        return false;
      }
    });

    advBookingsToday.forEach(ab => {
      const adv = parseFloat(ab.advancePaid) || 0;
      if (adv > 0) {
        const mode = (ab.paymentMode || '').toUpperCase();
        if (mode.includes('CASH')) {
          cashCollection += adv;
        } else if (mode.includes('UPI') || mode.includes('QR')) {
          upiCollection += adv;
        } else if (mode.includes('CARD') || mode.includes('DEBIT') || mode.includes('CREDIT')) {
          cardCollection += adv;
        } else {
          otherCollection += adv;
        }
      }
    });

    const totalCollectionsToday = cashCollection + upiCollection + cardCollection + otherCollection;

    return {
      todayDate: todayStr,
      totalRooms: rooms.length,
      availableCount: availableRooms.length,
      occupiedCount: occupiedRooms.length,
      reservedCount: reservedRooms.length,
      maintenanceCount: maintenanceRooms.length,
      occupancyPercentage: rooms.length > 0 ? Math.round((occupiedRooms.length / rooms.length) * 100) : 0,
      todayCheckInsCount: todayCheckIns.length,
      todayArrivalsCount: todayArrivals.length,
      todayRevenue: Math.round(todayRevenue),
      todayCheckIns,
      todayArrivals,
      settlement: {
        totalCollectionsToday: Math.round(totalCollectionsToday),
        cashCollection: Math.round(cashCollection),
        upiCollection: Math.round(upiCollection),
        cardCollection: Math.round(cardCollection),
        otherCollection: Math.round(otherCollection),
        pendingBalanceTotal: Math.round(pendingBalanceTotal),
        pendingGuestsCount,
        pendingGuestsList
      }
    };
  }
};

module.exports = { connectDB, db, defaultHotels, getISTDateStr };

