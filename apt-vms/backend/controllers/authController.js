const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, unitNumber } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ 
      name, email, phone, password, role: role || 'tenant', unitNumber,
      isApproved: role === 'admin' ? true : false 
    });

    res.status(201).json({ message: "Registration successful. Pending approval." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      if (!user.isApproved && user.role !== 'admin') {
        return res.status(403).json({ message: 'Account pending admin approval.' });
      }
      res.json({
        token: generateToken(user._id),
        user: { _id: user._id, name: user.name, email: user.email, role: user.role, unitNumber: user.unitNumber }
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// These two must be exported exactly like this for AuthRoutes to see them
exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ isApproved: false, role: 'tenant' });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    res.status(200).json({ success: true, message: `${user.name} approved.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};