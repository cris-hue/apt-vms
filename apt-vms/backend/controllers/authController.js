const User = require('../models/User'); 
const Visitor = require('../models/Visitor');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendApprovalEmail = async (user) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email not sent: SMTP config is missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.');
    return;
  }

  const roleText = user.role === 'tenant' ? 'tenant' : 'guard';
  const subject = 'SecureNest account approved';
  const text = `Hello ${user.name},\n\nYour SecureNest ${roleText} account has been approved. You can now log in using your registered email address and password.\n\nIf you did not request this access, please contact support.\n\nThanks,\nSecureNest Team`;
  const html = `
    <div style="font-family:system-ui, sans-serif; color:#1f2937;">
      <h2 style="color:#0f172a;">SecureNest Account Approved</h2>
      <p>Hello ${user.name},</p>
      <p>Your SecureNest <strong>${roleText}</strong> account has been approved.</p>
      <p>You can now log in with the email address you registered and your password.</p>
      <p style="margin-top:24px;">If you forgot your password, use the password reset link on the login page.</p>
      <p style="margin-top:24px; color:#475569;">Thanks,<br/>SecureNest Team</p>
    </div>
  `;

  const transporter = createEmailTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: user.email,
    subject,
    text,
    html,
  });
};

const sendAdminNotificationEmail = async (newUser) => {
  console.log(`\n=> [SYSTEM ALERTS] Checking if Admin Notification Email can be sent...`);

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n--- 🔔 SIMULATED ADMIN ALERT EMAIL ---');
    console.log(`Subject: New ${newUser.role} registration requires approval`);
    console.log(`Message: ${newUser.name} (${newUser.email}) registered and needs Admin approval.`);
    console.log('--------------------------------------\n');
    return;
  }

  try {
    const admins = await User.find({ role: 'admin' });
    if (admins.length === 0) {
      console.log('⚠️  [EMAIL ABORTED] No Administrators found in the database to notify!\n');
      return;
    }

    const adminEmails = admins.map(admin => admin.email).join(',');
    console.log(`=> [EMAIL PREP] Sending alert to ${admins.length} Admin(s): ${adminEmails}`);
    const roleText = newUser.role;

    const subject = `New ${roleText} registration requires approval`;
    const html = `
      <div style="font-family:system-ui, sans-serif; color:#1f2937;">
        <h2 style="color:#0f172a;">New Registration Request</h2>
        <p>A new user has registered as a <strong>${roleText}</strong> and is awaiting your approval.</p>
        <div style="background-color:#f8fafc; padding:16px; border-radius:8px; margin:16px 0;">
          <p style="margin:4px 0;"><strong>Name:</strong> ${newUser.name}</p>
          <p style="margin:4px 0;"><strong>Email:</strong> ${newUser.email}</p>
          <p style="margin:4px 0;"><strong>Phone:</strong> ${newUser.phone}</p>
          ${newUser.role === 'tenant' ? `<p style="margin:4px 0;"><strong>Unit:</strong> ${newUser.unitNumber}</p>` : ''}
        </div>
        <p>Please log in to the admin dashboard to review and approve this request.</p>
        <p style="margin-top:24px; color:#475569;">Thanks,<br/>SecureNest System</p>
      </div>
    `;

    const transporter = createEmailTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: adminEmails,
      subject,
      html,
    });
    console.log('✅ [EMAIL SUCCESS] Administrator(s) successfully notified!\n');
  } catch (err) {
    console.error('❌ [EMAIL ERROR] Failed to send the notification:', err.message, '\n');
  }
};

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

// @desc    Get all tenant units already taken
exports.getTakenUnits = async (req, res) => {
  try {
    const units = await User.distinct('unitNumber', { role: 'tenant', unitNumber: { $ne: null } });
    res.status(200).json({ success: true, units });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get aggregated stats for the admin dashboard
exports.getStats = async (req, res) => {
  try {
    const [userStats, visitorStats] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            pending: { $sum: { $cond: [{ $and: [{ $eq: ["$isApproved", false] }, { $ne: ["$role", "admin"] }] }, 1, 0] } },
            tenants: { $sum: { $cond: [{ $and: [{ $eq: ["$isApproved", true] }, { $eq: ["$role", "tenant"] }] }, 1, 0] } },
            guards: { $sum: { $cond: [{ $and: [{ $eq: ["$isApproved", true] }, { $eq: ["$role", "guard"] }] }, 1, 0] } }
          }
        }
      ]),
      Visitor.aggregate([
        {
          $group: {
            _id: null,
            inside: { $sum: { $cond: [{ $eq: ["$status", "Checked-In"] }, 1, 0] } },
            expired: { $sum: { $cond: [{ $eq: ["$status", "Expired"] }, 1, 0] } }
          }
        }
      ])
    ]);

    const uStats = userStats[0] || { pending: 0, tenants: 0, guards: 0 };
    const vStats = visitorStats[0] || { inside: 0, expired: 0 };

    res.status(200).json({
      success: true,
      data: { pending: uStats.pending, tenants: uStats.tenants, guards: uStats.guards, inside: vStats.inside, expired: vStats.expired }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
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
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    sendApprovalEmail(user).catch((err) => {
      console.error('Approval email failed:', err);
    });

    const io = req.app.get('io');
    if (io) io.emit('global-update');

    res.status(200).json({ success: true, message: "User approved" });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Delete/Revoke user
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    
    const io = req.app.get('io');
    if (io) io.emit('global-update');

    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Register user
exports.registerUser = async (req, res) => {
  try {
    let { name, email, password, role, phone, unitNumber } = req.body;
    email = String(email || '').trim().toLowerCase();
    name = String(name || '').trim();
    phone = String(phone || '').trim();
    role = String(role || 'tenant').trim();

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({ success: false, message: 'Please complete all required fields.' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'This email is already in use.' });
    }

    if (role === 'tenant') {
      unitNumber = String(unitNumber || '').trim().toUpperCase();
      if (!unitNumber) {
        return res.status(400).json({ success: false, message: 'Please select an apartment unit.' });
      }
      const existingUnit = await User.findOne({ role: 'tenant', unitNumber });
      if (existingUnit) {
        return res.status(400).json({ success: false, message: 'This apartment unit is already taken.' });
      }
    } else {
      unitNumber = undefined;
    }

    const isApproved = role === 'admin';
    const user = await User.create({ name, email, password, role, phone, unitNumber, isApproved });
    
    if (!isApproved) {
      sendAdminNotificationEmail(user).catch(err => console.error(err));
    }

    const io = req.app.get('io');
    if (io) io.emit('global-update');

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'This email is already in use.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};