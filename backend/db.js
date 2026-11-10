const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const HOTELS_FILE = path.join(DATA_DIR, 'hotels.json');
const BILLS_FILE = path.join(DATA_DIR, 'bills.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

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
    // Generate realistic initial bills for all 3 hotels for demo analytics
    const initialBills = [
      {
        id: 'bill-1',
        invoiceNo: 'HR-2026-0101',
        hotelId: 'hotel-1',
        hotelName: 'Hotel Rojana',
        billDate: '10-Nov-2026',
        billDateTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        customerName: 'Amitava Mukherjee',
        countryCode: '+91',
        customerPhone: '9830112233',
        idType: 'Aadhaar Card',
        idNumber: '4521 8899 1234',
        roomType: 'Deluxe Room',
        roomNumber: '204',
        numPersons: 2,
        checkInDateTime: '2026-11-08T12:00',
        checkOutDateTime: '2026-11-10T11:00',
        numDays: 2,
        roomRentPerDay: 2200,
        baseAccommodation: 4400,
        extraCharges: 400,
        subtotal: 4800,
        cgst: 120,
        sgst: 120,
        totalGst: 240,
        netTotal: 5040,
        advancePaid: 1500,
        balanceDue: 3540,
        paymentMode: 'UPI / QR',
        paymentStatus: 'PAID',
        remarks: 'Extra bed requested',
        amountInWords: 'Three Thousand Five Hundred Forty Rupees Only',
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'bill-2',
        invoiceNo: 'HSP-2026-0045',
        hotelId: 'hotel-2',
        hotelName: 'Hotel Sagar Priya',
        billDate: '10-Nov-2026',
        billDateTime: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        customerName: 'Priya Sen',
        countryCode: '+91',
        customerPhone: '9831998877',
        idType: 'Voter ID',
        idNumber: 'WB/01/234567',
        roomType: 'Premium Sea View',
        roomNumber: '108',
        numPersons: 3,
        checkInDateTime: '2026-11-09T13:00',
        checkOutDateTime: '2026-11-10T11:00',
        numDays: 1,
        roomRentPerDay: 2600,
        baseAccommodation: 2600,
        extraCharges: 500,
        subtotal: 3100,
        cgst: 77.5,
        sgst: 77.5,
        totalGst: 155,
        netTotal: 3255,
        advancePaid: 3255,
        balanceDue: 0,
        paymentMode: 'Cash',
        paymentStatus: 'PAID',
        remarks: 'Direct beach facing view',
        amountInWords: 'Three Thousand Two Hundred Fifty Five Rupees Only',
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      },
      {
        id: 'bill-3',
        invoiceNo: 'HSP-2026-0046',
        hotelId: 'hotel-2',
        hotelName: 'Hotel Sagar Priya',
        billDate: '10-Nov-2026',
        billDateTime: new Date().toISOString(),
        customerName: 'Debabrata Das',
        countryCode: '+91',
        customerPhone: '9433221100',
        idType: 'Aadhaar Card',
        idNumber: '8901 2345 6789',
        roomType: 'Executive Deluxe',
        roomNumber: '215',
        numPersons: 2,
        checkInDateTime: '2026-11-08T12:00',
        checkOutDateTime: '2026-11-10T11:00',
        numDays: 2,
        roomRentPerDay: 3500,
        baseAccommodation: 7000,
        extraCharges: 0,
        subtotal: 7000,
        cgst: 175,
        sgst: 175,
        totalGst: 350,
        netTotal: 7350,
        advancePaid: 2000,
        balanceDue: 5350,
        paymentMode: 'Debit / Credit Card',
        paymentStatus: 'DUE',
        remarks: 'Late checkout approved',
        amountInWords: 'Five Thousand Three Hundred Fifty Rupees Only',
        createdAt: new Date().toISOString()
      },
      {
        id: 'bill-4',
        invoiceNo: 'HSP-2026-0047',
        hotelId: 'hotel-3',
        hotelName: 'Hotel Sea Pearl',
        billDate: '09-Nov-2026',
        billDateTime: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        customerName: 'Sanjay Chakraborty',
        countryCode: '+91',
        customerPhone: '9734567890',
        idType: 'Driving License',
        idNumber: 'WB-29-2020-00912',
        roomType: 'Deluxe AC Room',
        roomNumber: '305',
        numPersons: 2,
        checkInDateTime: '2026-11-07T12:00',
        checkOutDateTime: '2026-11-09T11:00',
        numDays: 2,
        roomRentPerDay: 2400,
        baseAccommodation: 4800,
        extraCharges: 300,
        subtotal: 5100,
        cgst: 127.5,
        sgst: 127.5,
        totalGst: 255,
        netTotal: 5355,
        advancePaid: 5355,
        balanceDue: 0,
        paymentMode: 'UPI / QR',
        paymentStatus: 'PAID',
        remarks: 'Corporate booking',
        amountInWords: 'Five Thousand Three Hundred Fifty Five Rupees Only',
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
      }
    ];
    writeJSON(BILLS_FILE, initialBills);
  }
}

initializeData();

// Attempt MongoDB Connection
async function connectDB() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotel_billing_db';
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000
    });
    isMongoConnected = true;
    console.log(`[DB] Connected to MongoDB database at ${mongoURI}`);
  } catch (err) {
    isMongoConnected = false;
    console.log(`[DB] Notice: MongoDB local server not detected (${err.message}).`);
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

  async updateHotelPin(hotelId, newPin) {
    if (isMongoConnected) {
      const Hotel = require('./models/Hotel');
      await Hotel.findOneAndUpdate({ hotelId }, { managerPin: newPin, updatedAt: new Date() });
    }
    const hotels = readJSON(HOTELS_FILE, defaultHotels);
    const hotel = hotels.find(h => h.hotelId === hotelId);
    if (hotel) {
      hotel.managerPin = newPin;
      hotel.updatedAt = new Date().toISOString();
      writeJSON(HOTELS_FILE, hotels);
      return hotel;
    }
    return null;
  },

  async updateHotelDetails(hotelId, updateData) {
    if (isMongoConnected) {
      const Hotel = require('./models/Hotel');
      await Hotel.findOneAndUpdate({ hotelId }, { ...updateData, updatedAt: new Date() });
    }
    const hotels = readJSON(HOTELS_FILE, defaultHotels);
    const index = hotels.findIndex(h => h.hotelId === hotelId);
    if (index !== -1) {
      hotels[index] = { ...hotels[index], ...updateData, updatedAt: new Date().toISOString() };
      writeJSON(HOTELS_FILE, hotels);
      return hotels[index];
    }
    return null;
  },

  // Bills Operations
  async getBills(filter = {}) {
    let bills = [];
    if (isMongoConnected) {
      const Bill = require('./models/Bill');
      const query = {};
      if (filter.hotelId && filter.hotelId !== 'all') query.hotelId = filter.hotelId;
      if (filter.paymentMode && filter.paymentMode !== 'all') query.paymentMode = filter.paymentMode;
      if (filter.paymentStatus && filter.paymentStatus !== 'all') query.paymentStatus = filter.paymentStatus;
      bills = await Bill.find(query).sort({ createdAt: -1 });
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

    if (isMongoConnected) {
      const Bill = require('./models/Bill');
      const newBill = new Bill(billData);
      await newBill.save();
      return newBill;
    }

    const bills = readJSON(BILLS_FILE, []);
    bills.unshift(billData);
    writeJSON(BILLS_FILE, bills);
    return billData;
  },

  async getBillById(id) {
    if (isMongoConnected) {
      const Bill = require('./models/Bill');
      return await Bill.findById(id);
    }
    const bills = readJSON(BILLS_FILE, []);
    return bills.find(b => b.id === id || b._id === id || b.invoiceNo === id) || null;
  },

  async deleteBill(id) {
    if (isMongoConnected) {
      const Bill = require('./models/Bill');
      return await Bill.findByIdAndDelete(id);
    }
    let bills = readJSON(BILLS_FILE, []);
    const initialLen = bills.length;
    bills = bills.filter(b => b.id !== id && b._id !== id);
    writeJSON(BILLS_FILE, bills);
    return bills.length < initialLen;
  }
};

module.exports = { connectDB, db, defaultHotels };
