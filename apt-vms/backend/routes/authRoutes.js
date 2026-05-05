const express = require('express');
const router = express.Router();
// Import the functions from your AuthController
const { 
  registerUser, 
  loginUser, 
  getPendingUsers, 
  approveUser 
} = require('../controllers/authController');

// Import the middlewares from your AuthMiddleware
// Note: We use 'authorize' here because that is what your file exports
const { protect, authorize } = require('../middleware/authMiddleware');

// --- Public Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- Admin Only Routes ---
// We call authorize('admin') to create the specific guard for these routes
router.get('/pending', protect, authorize('admin'), getPendingUsers);
router.put('/approve/:id', protect, authorize('admin'), approveUser);

module.exports = router;