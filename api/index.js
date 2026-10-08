const app = require('../backend');
const connectDatabase = require('../backend/config/database');

module.exports = async (req, res) => {
  try {
    await connectDatabase();
  } catch {
    return res.status(503).json({ success: false, message: 'Database unavailable. Please try again shortly.' });
  }
  req.url = req.url.replace(/^\/api(?=\/|\?|$)/, '') || '/';
  return app(req, res);
};
