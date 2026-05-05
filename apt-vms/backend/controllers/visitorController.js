const Visitor = require('../models/Visitor');
const QRCode = require('qrcode');

// @desc    Register a new visitor and generate QR (Tenant Action)
exports.registerVisitor = async (req, res) => {
  try {
    const { name, idNumber, gender, phone, purpose } = req.body;
    
    // Create a unique string for the QR code
    const qrData = `VMS-${idNumber}-${Date.now()}`;
    
    // Generate a Base64 image of the QR code
    const qrCodeImage = await QRCode.toDataURL(qrData);

    const visitor = await Visitor.create({
      name,
      idNumber,
      gender,
      phone,
      purpose,
      tenantId: req.user._id, // Set by protect middleware
      qrCode: qrData,
    });

    res.status(201).json({ success: true, visitor, qrCodeImage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Find visitor by QR string (Guard Action)
exports.getVisitorByQR = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ qrCode: req.params.qrCode })
      .populate('tenantId', 'name unitNumber'); // Corrected to unitNumber
      
    if (!visitor) return res.status(404).json({ message: 'Invalid QR Code' });
    res.status(200).json({ success: true, data: visitor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Guard checks in a visitor
exports.checkInVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });

    visitor.status = 'Checked-In';
    visitor.checkInTime = Date.now();
    visitor.checkedInBy = req.user._id;

    await visitor.save();
    res.status(200).json({ success: true, message: `${visitor.name} checked in.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Guard checks out a visitor
exports.checkOutVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });

    visitor.status = 'Checked-Out';
    visitor.checkOutTime = Date.now();
    visitor.checkedOutBy = req.user._id;

    await visitor.save();
    res.status(200).json({ success: true, message: `${visitor.name} checked out.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};