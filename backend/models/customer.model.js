const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Describe a customer document. Required fields cannot be empty; trim removes surrounding spaces.
const customerSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  // MongoDB uses a unique index to prevent duplicate emails.
  email: { type: String, required: true, unique: true, trim: true },
  // Hide the hash from normal queries. Controllers explicitly request it for password checks.
  password: { type: String, required: true, minlength: 6, select: false },
  phone: { type: String, required: true, trim: true },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  cartRevision: { type: Number, default: 0 },
  cart: [{
    _id: false,
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1, min: 1, validate: Number.isInteger }
  }],
  // Use the current time when the customer is created.
  createdAt: { type: Date, default: Date.now }
}, { optimisticConcurrency: true });

// Hash new or changed passwords before saving.
customerSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
});
// Compare the entered password with the saved hash; hashing cannot be reversed.
customerSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password);
};
// Export the model used by controllers to read and save customers.
module.exports = mongoose.model('Customer', customerSchema);
