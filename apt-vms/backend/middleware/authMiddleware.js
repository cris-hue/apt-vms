const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Authentication: Verifies the JWT and attaches the user to the request
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from string "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request (minus password)
      // We use decoded.id because that is what we set in AuthController.js
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User account no longer exists' });
      }

      next();
    } catch (error) {
      console.error("Auth Error:", error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// 2. Authorization: Restricts access based on user roles (e.g., 'admin', 'guard')
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists and if their role is in the allowed list
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied: Role '${req.user?.role || 'unknown'}' is not authorized` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };