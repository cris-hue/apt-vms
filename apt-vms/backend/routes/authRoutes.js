const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getPendingUsers, 
  approveUser,
  getApprovedUsers,
  deleteUser,
  updateMe 
} = require('../controllers/authController');

const { protect, authorize } = require('../middleware/authMiddleware');

// --- Public Access Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- Authenticated User Routes (Tenant/Guard/Admin) ---
/**
 * This route handles the "Update My Profile" action.
 * It is protected so only the logged-in user can update their own data.
 */
router.put('/update-me', protect, updateMe);

// --- Admin-Only Management Routes ---
router.get('/pending', protect, authorize('admin'), getPendingUsers);
router.get('/approved', protect, authorize('admin'), getApprovedUsers);
router.put('/approve/:id', protect, authorize('admin'), approveUser);
router.delete('/delete/:id', protect, authorize('admin'), deleteUser);

module.exports = router;