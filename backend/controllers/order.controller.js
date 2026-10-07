const crypto = require('node:crypto');
const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Order = require('../models/order.model');
const payments = require('../config/razorpay');

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const publicOrder = order => {
  const result = order.toObject();
  delete result.cartVersion;
  return result;
};

exports.createPaymentOrder = async (req, res) => {
  const address = {};
  for (const field of ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode']) {
    const value = req.body?.shippingAddress?.[field];
    if (typeof value !== 'string' || !value.trim() || value.length > 250) {
      return fail(res, 400, `Shipping ${field} is required and must be at most 250 characters.`);
    }
    address[field] = value.trim();
  }
  if (!/^\d{10}$/.test(address.phone)) return fail(res, 400, 'Phone must contain 10 digits.');
  if (!/^\d{6}$/.test(address.pincode)) return fail(res, 400, 'Pincode must contain 6 digits.');
  const customer = await Customer.findById(req.user._id).populate('cart.product');
  if (!customer.cart.length) return fail(res, 400, 'Your cart is empty.');
  const items = [];
  let amount = 0;
  for (const { product, quantity } of customer.cart) {
    if (!product) return fail(res, 400, 'A product in your cart is no longer available.');
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > product.stock) {
      return fail(res, 400, `Insufficient stock for ${product.name}. Please update your cart.`);
    }
    const priceInPaise = Math.round(product.price * 100);
    if (!Number.isSafeInteger(priceInPaise) || priceInPaise < 1) return fail(res, 400, 'Invalid product price.');
    amount += priceInPaise * quantity;
    items.push({ product: product._id, name: product.name, price: priceInPaise / 100, quantity, image: product.image });
  }
  if (!Number.isSafeInteger(amount) || amount < 100) return fail(res, 400, 'Order total must be at least ₹1 and within the supported amount.');
  let gateway;
  try { gateway = payments.getRazorpay(); }
  catch (error) { return fail(res, 503, error.message); }
  const order = await Order.create({ user: customer._id, items, shippingAddress: address, totalAmount: amount / 100, cartVersion: customer.cartRevision });
  try {
    const paymentOrder = await gateway.client.orders.create({ amount, currency: 'INR', receipt: order.id });
    order.razorpayOrderId = paymentOrder.id;
    await order.save();
  } catch {
    await Order.updateOne({ _id: order._id }, { $set: { paymentStatus: 'FAILED' } });
    return fail(res, 502, 'Unable to start payment. Your cart is unchanged. Please try again.');
  }
  res.status(201).json({ success: true, shopKartOrderId: order.id, razorpayOrderId: order.razorpayOrderId, amount, currency: 'INR', key: gateway.key });
};

exports.verifyPayment = async (req, res) => {
  const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!mongoose.isObjectIdOrHexString(shopKartOrderId)) return fail(res, 400, 'Invalid order ID.');
  const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id }).select('+cartVersion');
  if (!order) return fail(res, 404, 'Order not found.');
  if (!order.razorpayOrderId || order.razorpayOrderId !== razorpay_order_id ||
      typeof razorpay_payment_id !== 'string' || !/^pay_[a-zA-Z0-9]+$/.test(razorpay_payment_id) ||
      typeof razorpay_signature !== 'string' || !/^[a-fA-F0-9]{64}$/.test(razorpay_signature)) {
    return fail(res, 400, 'Invalid payment signature.');
  }
  let secret;
  try { ({ secret } = payments.getRazorpay()); }
  catch (error) { return fail(res, 503, error.message); }
  const expected = crypto.createHmac('sha256', secret).update(`${order.razorpayOrderId}|${razorpay_payment_id}`).digest();
  if (!crypto.timingSafeEqual(expected, Buffer.from(razorpay_signature, 'hex'))) return fail(res, 400, 'Invalid payment signature.');
  // Only the first valid callback changes payment/status. Replays cannot regress shipping status.
  await Order.updateOne({ _id: order._id, paymentStatus: 'PENDING' }, {
    $set: { paymentStatus: 'PAID', status: 'PLACED', razorpayPaymentId: razorpay_payment_id }
  });
  const paid = await Order.findById(order._id);
  if (paid.paymentStatus !== 'PAID' || paid.razorpayPaymentId !== razorpay_payment_id) return fail(res, 409, 'Payment cannot be applied to this order.');
  // Persist payment first. If clearing fails, the same signed request safely retries it.
  // Do not erase items edited or added in another tab while payment was open.
  const revisionFilter = order.cartVersion === 0
    ? { $or: [{ cartRevision: 0 }, { cartRevision: { $exists: false } }] }
    : { cartRevision: order.cartVersion };
  await Customer.updateOne({ _id: req.user._id, ...revisionFilter }, { $set: { cart: [] }, $inc: { __v: 1, cartRevision: 1 } });
  res.json({ success: true, order: publicOrder(paid) });
};

exports.getOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1, _id: -1 });
  res.json({ success: true, orders });
};

exports.getOrder = async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return fail(res, 400, 'Invalid order ID.');
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return fail(res, 404, 'Order not found.');
  res.json({ success: true, order });
};

exports.updateStatus = async (req, res) => {
  const token = process.env.ORDER_ADMIN_TOKEN;
  const supplied = req.get('X-Order-Admin-Token');
  if (process.env.NODE_ENV === 'production' || !token || typeof supplied !== 'string' ||
      Buffer.byteLength(token) !== Buffer.byteLength(supplied) || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(supplied))) {
    return fail(res, 403, 'Development admin access required.');
  }
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return fail(res, 400, 'Invalid order ID.');
  const previous = { CONFIRMED: 'PLACED', SHIPPED: 'CONFIRMED', DELIVERED: 'SHIPPED' }[req.body?.status];
  if (!previous) return fail(res, 400, 'Invalid order status.');
  const order = await Order.findOneAndUpdate({ _id: req.params.id, paymentStatus: 'PAID', status: previous }, { $set: { status: req.body.status } }, { returnDocument: 'after' });
  if (!order) return fail(res, 409, 'Order must be paid and advance one status at a time.');
  res.json({ success: true, order });
};
