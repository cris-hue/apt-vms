const Visitor = require('../models/Visitor');
const QRCode = require('qrcode');
const mongoose = require('mongoose');

// @desc    Register a new visitor (Tenant Action)
exports.registerVisitor = async (req, res) => {
  try {
    const { name, idNumber, gender, phone, purpose } = req.body;
    const tenantId = new mongoose.Types.ObjectId(req.user._id || req.user.id);
    const qrData = `VMS-${idNumber}-${Date.now()}`;
    const qrCodeImage = await QRCode.toDataURL(qrData);

    const visitor = await Visitor.create({
      name, idNumber, gender, phone, purpose,
      tenantId, qrCode: qrData,
    });

    res.status(201).json({ success: true, visitor, qrCodeImage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get only the visitors belonging to the logged-in tenant
exports.getMyVisitors = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id || req.user.id);
    const visitors = await Visitor.find({ tenantId: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: visitors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a pending visitor (Tenant Action)
exports.updateVisitor = async (req, res) => {
  try {
    let visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: "Invite not found" });

    if (visitor.status !== 'Pending') {
      return res.status(400).json({ success: false, message: "Pass already used" });
    }

    visitor = await Visitor.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after', runValidators: true
    });

    res.status(200).json({ success: true, data: visitor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    REVOKE & DELETE PASS (Tenant Action)
exports.deleteVisitor = async (req, res) => {
  try {
    const visitorId = req.params.id;
    // Using findByIdAndDelete to ensure atomic removal
    const visitor = await Visitor.findByIdAndDelete(visitorId);

    if (!visitor) {
      return res.status(404).json({ success: false, message: "Pass not found" });
    }

    // This log confirms it's gone from MongoDB
    console.log(`DATABASE: Visitor ${visitorId} permanently deleted.`);

    res.status(200).json({ 
      success: true, 
      message: "Pass successfully removed from database." 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all visitors (Admin/Guard Action)
exports.getAllVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find().populate('tenantId', 'name unitNumber').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: visitors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Find visitor by QR string
exports.getVisitorByQR = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ qrCode: req.params.qrCode }).populate('tenantId', 'name unitNumber');
    if (!visitor) return res.status(404).json({ message: 'Invalid QR Code' });
    res.status(200).json({ success: true, data: visitor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check-In visitor (Guard)
exports.checkInVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });
    visitor.status = 'Checked-In';
    visitor.checkInTime = Date.now();
    visitor.checkedInBy = req.user._id;
    await visitor.save();

    const io = req.app.get('io');
    if (io && visitor.tenantId) {
      const room = `tenant_${visitor.tenantId.toString()}`;
      io.to(room).emit('visitor-status-updated', {
        type: 'checkin',
        visitor: {
          _id: visitor._id,
          name: visitor.name,
          status: visitor.status,
          checkInTime: visitor.checkInTime,
          checkOutTime: visitor.checkOutTime,
          purpose: visitor.purpose,
          phone: visitor.phone,
          idNumber: visitor.idNumber,
        },
      });
    }

    res.status(200).json({ success: true, message: `${visitor.name} checked in.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check-Out visitor (Guard)
exports.checkOutVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });
    visitor.status = 'Checked-Out';
    visitor.checkOutTime = Date.now();
    visitor.checkedOutBy = req.user._id;
    await visitor.save();

    const io = req.app.get('io');
    if (io && visitor.tenantId) {
      const room = `tenant_${visitor.tenantId.toString()}`;
      io.to(room).emit('visitor-status-updated', {
        type: 'checkout',
        visitor: {
          _id: visitor._id,
          name: visitor.name,
          status: visitor.status,
          checkInTime: visitor.checkInTime,
          checkOutTime: visitor.checkOutTime,
          purpose: visitor.purpose,
          phone: visitor.phone,
          idNumber: visitor.idNumber,
        },
      });
    }

    res.status(200).json({ success: true, message: `${visitor.name} checked out.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};