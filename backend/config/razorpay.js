const Razorpay = require('razorpay');

exports.getRazorpay = () => {
  const { RAZORPAY_KEY_ID: key, RAZORPAY_KEY_SECRET: secret } = process.env;
  if (!key?.startsWith('rzp_test_') || !secret) {
    const error = new Error('Razorpay test payments are not configured. Add test keys to backend/.env.');
    error.status = 503;
    throw error;
  }
  return { client: new Razorpay({ key_id: key, key_secret: secret }), key, secret };
};
