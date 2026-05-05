const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  idNumber: { type: String, required: true }, // National ID or Passport
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'], 
    required: true 
  },
  phone: { type: String, required: true },
  purpose: { type: String, required: true }, // e.g., "Visiting", "Delivery"
  
  tenantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  qrCode: { type: String, unique: true, required: true }, 

  status: { 
    type: String, 
    enum: ['Pending', 'Checked-In', 'Checked-Out'], 
    default: 'Pending' 
  },
  
  checkInTime: { type: Date },
  checkOutTime: { type: Date },

  checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checkedOutBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Visitor', visitorSchema);