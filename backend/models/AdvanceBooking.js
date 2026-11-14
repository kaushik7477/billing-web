const mongoose = require('mongoose');

const AdvanceBookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  hotelId: { type: String, required: true, index: true },
  hotelName: { type: String, required: true },
  customerName: { type: String, required: true },
  countryCode: { type: String, default: '+91' },
  customerPhone: { type: String, required: true },
  idType: { type: String, default: 'Aadhaar Card' },
  idNumber: { type: String, default: '' },
  roomType: { type: String, required: true },
  roomNumber: { type: String, default: '' },
  numPersons: { type: Number, default: 2 },
  checkInDate: { type: String, required: true }, // "YYYY-MM-DD"
  checkOutDate: { type: String, required: true }, // "YYYY-MM-DD"
  expectedDays: { type: Number, default: 1 },
  advancePaid: { type: Number, default: 0 },
  paymentMode: { type: String, default: 'UPI / QR' },
  remarks: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['RESERVED', 'CHECKED_IN', 'CANCELLED'], 
    default: 'RESERVED',
    index: true
  },
  cancellationType: { type: String, default: '' },
  cancellationReason: { type: String, default: '' },
  refundAmount: { type: Number, default: 0 },
  refundMethod: { type: String, default: '' },
  cancelledAt: { type: Date }
}, { 
  timestamps: true 
});

module.exports = mongoose.models.AdvanceBooking || mongoose.model('AdvanceBooking', AdvanceBookingSchema);

