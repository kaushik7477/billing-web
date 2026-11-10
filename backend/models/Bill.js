const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true },
  hotelId: { type: String, required: true, index: true },
  hotelName: { type: String, required: true },
  billDate: { type: String, required: true },
  billDateTime: { type: Date, default: Date.now, index: true },
  
  // Guest Details
  customerName: { type: String, required: true },
  countryCode: { type: String, default: '+91' },
  customerPhone: { type: String, required: true },
  idType: { type: String, default: 'Aadhaar Card' },
  idNumber: { type: String, default: '' },
  
  // Stay Details
  roomType: { type: String, required: true },
  roomNumber: { type: String, required: true },
  numPersons: { type: Number, default: 1 },
  checkInDateTime: { type: String, required: true },
  checkOutDateTime: { type: String, required: true },
  numDays: { type: Number, default: 1 },
  
  // Financials
  roomRentPerDay: { type: Number, required: true },
  baseAccommodation: { type: Number, required: true },
  extraCharges: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  cgst: { type: Number, required: true },
  sgst: { type: Number, required: true },
  totalGst: { type: Number, required: true },
  netTotal: { type: Number, required: true },
  advancePaid: { type: Number, default: 0 },
  balanceDue: { type: Number, required: true },
  
  // Meta
  paymentMode: { type: String, default: 'Cash' },
  paymentStatus: { type: String, enum: ['PAID', 'DUE', 'REFUND'], default: 'DUE' },
  remarks: { type: String, default: '' },
  amountInWords: { type: String, default: '' },
  createdByName: { type: String, default: 'Hotel Manager' }
}, {
  timestamps: true
});

module.exports = mongoose.models.Bill || mongoose.model('Bill', BillSchema);
