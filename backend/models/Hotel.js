const mongoose = require('mongoose');

const RoomTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  defaultRent: { type: Number, required: true }
});

const HotelSchema = new mongoose.Schema({
  hotelId: { type: String, required: true, unique: true }, // e.g. "hotel-1", "hotel-2", "hotel-3"
  name: { type: String, required: true },
  subText: { type: String, default: '' },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  gstin: { type: String, required: true },
  managerPin: { type: String, default: '1111' }, // Legacy 4-digit PIN
  managerUsername: { type: String, required: true, index: true }, // User ID e.g. "hotel1"
  managerPassword: { type: String, required: true }, // Password e.g. "hotel1234"
  themeColor: { type: String, default: '#1a365d' },
  tagline: { type: String, default: 'Luxury & Comfort in Digha' },
  gstPercentage: { type: Number, default: 5 },
  invoiceFormat: { type: String, default: 'standard' }, // 'standard' or 'numeric'
  customInvoiceStart: { type: Number, default: 1 }, // e.g. 1769
  nonGstStartNumber: { type: Number, default: 10001 }, // e.g. 10001
  roomTypes: [RoomTypeSchema],
  signatureImage: { type: String, default: 'manager-sign.png' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Hotel || mongoose.model('Hotel', HotelSchema);

