const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true }, // Captured for visitor sharing
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'tenant', 'guard'], 
    default: 'tenant' 
  },
  unitNumber: { type: String }, // Standardized field name
  isApproved: { 
    type: Boolean, 
    default: false // Admin must approve before login works
  }
}, { timestamps: true });

// Hash password before saving to DB
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Helper method to check password during login
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);