const express = require('express');
const router = express.Router();

const { 
  registerVisitor, 
  checkInVisitor, 
  checkOutVisitor, 
  getVisitorByQR 
} = require('../controllers/visitorController');

const { protect, authorize } = require('../middleware/authMiddleware');

// --- PUBLIC ROUTES ---
// This allows guests to view their pass without logging in
router.get('/public/pass/:qrCode', getVisitorByQR);

// --- TENANT ROUTES ---
router.post('/register', protect, authorize('tenant'), registerVisitor);

// --- GUARD ROUTES ---
// We keep these protected so only a logged-in guard can scan for the purpose of entry/exit
router.get('/scan/:qrCode', protect, authorize('guard'), getVisitorByQR);
router.put('/checkin/:id', protect, authorize('guard'), checkInVisitor);
router.put('/checkout/:id', protect, authorize('guard'), checkOutVisitor);

module.exports = router;