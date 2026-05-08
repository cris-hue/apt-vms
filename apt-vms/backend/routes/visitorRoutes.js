const express = require('express');
const router = express.Router();

const { 
  registerVisitor, 
  checkInVisitor, 
  checkOutVisitor, 
  getVisitorByQR,
  getAllVisitors,
  getMyVisitors,
  updateVisitor,
  deleteVisitor
} = require('../controllers/visitorController');

const { protect, authorize } = require('../middleware/authMiddleware');

// --- PUBLIC ROUTES ---
router.get('/public/pass/:qrCode', getVisitorByQR);

// --- TENANT ROUTES ---
router.post('/register', protect, authorize('tenant'), registerVisitor);
router.get('/my-visitors', protect, authorize('tenant'), getMyVisitors);

// Routes for Managing Active Passes
router.put('/:id', protect, authorize('tenant'), updateVisitor);
router.delete('/:id', protect, authorize('tenant'), deleteVisitor);

// --- GUARD ROUTES ---
router.get('/all', protect, authorize('guard', 'admin'), getAllVisitors);
router.get('/scan/:qrCode', protect, authorize('guard'), getVisitorByQR);
router.put('/checkin/:id', protect, authorize('guard'), checkInVisitor);
router.put('/checkout/:id', protect, authorize('guard'), checkOutVisitor);

module.exports = router;