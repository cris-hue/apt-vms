const User = require('../models/User'); 
const jwt = require('jsonwebtoken');

// @desc    Login user
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    if (user.role !== 'admin' && !user.isApproved) {
      return res.status(403).json({ success: false, message: "Account pending approval." });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(200).json({
      success: true, token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, unitNumber: user.unitNumber, phone: user.phone }
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Update profile (Phone only)
exports.updateMe = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      { $set: { phone } }, 
      { new: true, runValidators: false }
    ).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Get all users awaiting approval
exports.getPendingUsers = async (req, res) => {
  try {
    console.log("=> [Controller] Fetching Pending...");
    const users = await User.find({ isApproved: false, role: { $ne: 'admin' } }).select('-password');
    res.status(200).json({ success: true, data: users });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Get all approved users
exports.getApprovedUsers = async (req, res) => {
  try {
    console.log("=> [Controller] Fetching Approved...");
    const users = await User.find({ isApproved: true, role: { $ne: 'admin' } }).select('-password');
    res.status(200).json({ success: true, data: users });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Approve user account
exports.approveUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isApproved: true });
    res.status(200).json({ success: true, message: "User approved" });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Delete/Revoke user
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Register user
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, unitNumber } = req.body;
    const isApproved = role === 'admin';
    const user = await User.create({ name, email, password, role, phone, unitNumber, isApproved });
    res.status(201).json({ success: true, data: user });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};