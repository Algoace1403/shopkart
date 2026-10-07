const mongoose = require('mongoose');

const requiredText = { type: String, required: true, trim: true };
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  items: [{
    _id: false,
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: requiredText,
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    image: String
  }],
  shippingAddress: {
    fullName: requiredText, phone: requiredText, addressLine1: requiredText,
    city: requiredText, state: requiredText, pincode: requiredText
  },
  totalAmount: { type: Number, required: true, min: 0 },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
  status: { type: String, enum: ['PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'], default: 'PENDING_PAYMENT' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  // Compare-and-clear makes verification retries safe on standalone MongoDB too.
  cartVersion: { type: Number, required: true, select: false }
}, { timestamps: true });
orderSchema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model('Order', orderSchema);
