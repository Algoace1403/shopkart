const Customer = require('../models/customer.model');
const generateTokenAndSetCookie = require('../utils/generateToken');

// Return only the customer fields allowed in API responses, never the password hash.
function customerInfo(customer) {
  return { _id: customer._id, fullName: customer.fullName, email: customer.email, phone: customer.phone };
}

// POST /customers/register: validate the form, reject duplicates and save the customer.
exports.registerCustomer = async (req, res) => {
  try {
    // Fall back to an empty object if the request has no JSON body.
    const { fullName, email, password, phone } = req.body || {};
    // Every required value must be a nonempty string.
    if (![fullName, email, password, phone].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must contain at least 6 characters' });
    }
    if (await Customer.findOne({ email: email.trim() })) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    // The model hashes the password before this document is saved.
    const customer = await Customer.create({ fullName, email, password, phone });
    res.status(201).json({ success: true, message: 'Customer registered successfully', customer: customerInfo(customer) });
  } catch (error) {
    // Also handle two requests trying to register the same email at the same time.
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Email already exists' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /customers/login: verify credentials and set the authentication cookie. 
exports.loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
    // Include the normally hidden hash so bcrypt can check the entered password.
    const customer = await Customer.findOne({ email: email.trim() }).select('+password');
    // Use the same error for an unknown email and a wrong password.
    if (!customer || !(await customer.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
    // The browser stores the JWT in an HttpOnly cookie automatically.
    generateTokenAndSetCookie(customer._id, res);
    res.json({ success: true, message: 'Login successful', customer: customerInfo(customer) });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /customers/me: authentication middleware has already loaded req.user.
exports.getProfile = (req, res) => res.json(customerInfo(req.user));
// POST /customers/logout: expire the cookie using the same options used to set it.
exports.logoutCustomer = (req, res) => {
  res.clearCookie('jwt', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
  res.json({ success: true, message: 'Logged out successfully' });
};

// Lab 01 bonus: check the old password before saving a new password.
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (typeof oldPassword !== 'string' || !oldPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Provide the old password and a new password of at least 6 characters' });
    }
    const customer = await Customer.findById(req.user._id).select('+password');
    if (!customer || !(await customer.matchPassword(oldPassword))) {
      return res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
    // Saving triggers the model hook, which hashes the new password.
    customer.password = newPassword;
    await customer.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
