const mongoose = require('mongoose');

// Describe the fields and validation rules for products stored in MongoDB.
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  // Accept only a finite number greater than zero.
  price: { type: Number, required: true, validate: value => Number.isFinite(value) && value > 0 },
  category: { type: String, required: true, trim: true },
  image: { type: String, required: true, trim: true },
  // Zero stock is allowed, but negative or infinite stock is invalid.
  stock: { type: Number, required: true, min: 0, validate: Number.isFinite },
  // Automatically record when the product is created.
  createdAt: { type: Date, default: Date.now }
});
// Export the model for product queries and creation.
module.exports = mongoose.model('Product', productSchema);
