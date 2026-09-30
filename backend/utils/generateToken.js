const jwt = require('jsonwebtoken');

// Create a signed token containing the customer ID, valid for 15 days.
module.exports = (customerId, res) => {
  const token = jwt.sign({ id: customerId }, process.env.JWT_SECRET, { expiresIn: '15d' });
  // Send Set-Cookie so the browser stores the token and sends it on later requests.
  res.cookie('jwt', token, {
    maxAge: 15 * 24 * 60 * 60 * 1000, // Cookie lifetime in milliseconds.
    httpOnly: true, // Frontend JavaScript cannot read this cookie.
    sameSite: 'strict', // Send the cookie only with same-site requests.
    secure: process.env.NODE_ENV === 'production' // Require HTTPS in production; allow local HTTP.
  });
};
