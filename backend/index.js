// Load PORT, MONGODB_URI and JWT_SECRET from .env before starting the server.
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');

// Create the server and allow the React app to send login cookies.
const app = express();
app.use(cors({ origin: 'http://localhost:5174', credentials: true }));
// Read JSON request bodies and expose cookies as req.cookies.
app.use(express.json());
app.use(cookieParser());
// Add the URL prefixes to the routes defined in the route files.
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/wishlist', require('./routes/wishlist.routes'));
app.use('/cart', require('./routes/cart.routes'));
app.use('/orders', require('./routes/order.routes'));
// Express requires all four arguments to recognize an error handler.
// Send a JSON error for malformed request bodies or unexpected failures.
app.use((error, req, res, next) => {
  res.status(error.status === 400 ? 400 : 500).json({
    success: false, message: error.status === 400 ? 'Invalid request body' : 'Server error'
  });
});

// Start only when running this file directly; tests can import app without starting it.
if (require.main === module) {
  require('./config/database')()
    .then(async () => {
      // Wait for the unique email index before accepting registrations.
      await require('./models/customer.model').init();
      const port = process.env.PORT || 5001;
      app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
    })
    .catch(() => {
      console.error('MongoDB connection failed. Check MONGODB_URI and that MongoDB is running.');
      process.exitCode = 1;
    });
}
// Let API checks import and run the same Express app.
module.exports = app;
