const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true }, // e.g. "hotel-1-101"
  hotelId: { type: String, required: true, index: true },
  roomNumber: { type: String, required: true }, // e.g. "101"
  floor: { type: Number, required: true }, // 1, 2, 3
  roomType: { type: String, required: true }, // e.g. "Deluxe Room"
  defaultRent: { type: Number, required: true }, // e.g. 2200
  status: { 
    type: String, 
    enum: ['available', 'occupied', 'reserved', 'maintenance'], 
    default: 'available',
    index: true
  },
  currentGuestName: { type: String, default: '' },
  currentGuestPhone: { type: String, default: '' },
  currentBillId: { type: String, default: '' },
  currentInvoiceNo: { type: String, default: '' },
  checkInDateTime: { type: String, default: '' },
  expectedCheckOutDateTime: { type: String, default: '' },
  maintenanceUntil: { type: Date, default: null }, // 30-min housekeeping cycle after checkout
  activeIssues: [{
    id: { type: String },
    issue: { type: String, required: true },
    reportedAt: { type: Date, default: Date.now },
    reportedBy: { type: String, default: 'Manager' },
    isFixed: { type: Boolean, default: false },
    fixedAt: { type: Date }
  }]
}, { 
  timestamps: true 
});

module.exports = mongoose.models.Room || mongoose.model('Room', RoomSchema);

