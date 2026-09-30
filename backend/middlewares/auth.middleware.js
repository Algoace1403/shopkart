const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Customer = require('../models/customer.model');

// Run before protected controllers. Only a valid cookie can continue to next().
module.exports = async (req, res, next) => {
  // cookie-parser has already read the cookies sent by the browser.
  const token = req.cookies.jwt;
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  let decoded;
  try {
    // Verify the signature and expiry, then check the customer ID format.
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id || !mongoose.isObjectIdOrHexString(decoded.id)) throw new Error();
  } catch {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    // Load the current customer without the password and attach it to this request.
    req.user = await Customer.findById(decoded.id);
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    // Continue to the profile, logout or change-password controller.
    next();
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
