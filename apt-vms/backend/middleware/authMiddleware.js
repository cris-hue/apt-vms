const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  console.log("=> [Auth] Checking Bearer Token...");

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        console.log("=> [Auth Error] User not found");
        return res.status(401).json({ success: false, message: 'User account no longer exists' });
      }

      console.log(`=> [Auth Success] Verified: ${req.user.name}`);
      return next(); 
    } catch (error) {
      console.error("=> [Auth Error] JWT Failed:", error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.log("=> [Auth Error] No token provided");
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      console.log(`=> [Auth Forbidden] Role '${req.user?.role}' unauthorized`);
      return res.status(403).json({ 
        success: false,
        message: `Access denied: Role '${req.user?.role || 'unknown'}' is not authorized` 
      });
    }
    console.log(`=> [Auth Granted] Role '${req.user.role}' authorized`);
    return next();
  };
};

module.exports = { protect, authorize };