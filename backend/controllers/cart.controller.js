const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

async function sendCart(userId, res, message) {
  const customer = await Customer.findById(userId).populate({
    path: 'cart.product', select: 'name price category image stock'
  });
  // Deleted products must not break totals or rendering.
  const cart = customer.cart.filter(item => item.product);
  res.json({ success: true, ...(message && { message }), cart });
}

exports.getCart = (req, res) => sendCart(req.user._id, res);
exports.validateId = (req, res, next) => {
  if (!mongoose.isObjectIdOrHexString(req.params.productId)) {
    return res.status(400).json({ success: false, message: 'Invalid product ID' });
  }
  next();
};

// Retry concurrent edits against a fresh document so rows cannot be duplicated
// and increments cannot overwrite each other.
async function changeCart(req, res, action) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const customer = await Customer.findById(req.user._id);
    const index = customer.cart.findIndex(item => item.product.equals(req.params.productId));
    if (action === 'remove') {
      if (index < 0) return res.status(404).json({ success: false, message: 'Product not in cart' });
      customer.cart.splice(index, 1);
    } else {
      const product = await Product.findById(req.params.productId);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      if (action === 'update' && index < 0) {
        return res.status(404).json({ success: false, message: 'Product not in cart' });
      }
      const quantity = action === 'add' ? (index < 0 ? 1 : customer.cart[index].quantity + 1) : req.body?.quantity;
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
        return res.status(400).json({ success: false, message: 'Quantity must be a whole number from 1 up to available stock' });
      }
      if (index < 0) customer.cart.push({ product: product._id, quantity });
      else customer.cart[index].quantity = quantity;
    }
    try {
      customer.cartRevision += 1;
      await customer.save();
      return sendCart(customer._id, res, 'Cart updated');
    } catch (error) {
      if (error.name !== 'VersionError') throw error;
    }
  }
  res.status(409).json({ success: false, message: 'Cart changed. Please try again.' });
}

exports.addProduct = (req, res) => changeCart(req, res, 'add');
exports.updateQuantity = (req, res) => changeCart(req, res, 'update');
exports.removeProduct = (req, res) => changeCart(req, res, 'remove');
