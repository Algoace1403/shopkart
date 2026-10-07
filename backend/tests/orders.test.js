// Isolated API/database tests. Only the Razorpay network call is simulated.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
process.env.JWT_SECRET = 'lab6-isolated-test-jwt';
process.env.RAZORPAY_KEY_ID = 'rzp_test_local';
process.env.RAZORPAY_KEY_SECRET = 'isolated-test-signature-secret';
process.env.ORDER_ADMIN_TOKEN = 'isolated-admin-token';
const app = require('../index');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const payments = require('../config/razorpay');

const address = { fullName: 'Lab Tester', phone: '9876543210', addressLine1: '22 Test Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' };
test('Lab 06 checkout, signatures, ownership, snapshots and replay safety', async t => {
  const dbName = `shopkart_lab6_test_${Date.now()}`;
  await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017', { dbName, serverSelectionTimeoutMS: 5000 });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const realGateway = payments.getRazorpay;
  let gatewayFails = false;
  let gatewayRequest;
  payments.getRazorpay = () => ({ key: process.env.RAZORPAY_KEY_ID, secret: process.env.RAZORPAY_KEY_SECRET, client: { orders: { create: async body => {
    gatewayRequest = body;
    if (gatewayFails) throw new Error('Simulated gateway outage');
    return { id: `order_${crypto.randomBytes(8).toString('hex')}`, ...body };
  } } } });
  let cookie;
  async function request(path, method = 'GET', body, auth = cookie, headers = {}) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(auth && { Cookie: auth }), ...headers }, ...(body !== undefined && { body: JSON.stringify(body) }) });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  async function expectStatus(path, method, body, status, auth, headers) {
    const response = await request(path, method, body, auth, headers);
    assert.equal(response.status, status, JSON.stringify(response.data));
    return response.data;
  }
  function signature(order, payment = 'pay_test123') {
    return { shopKartOrderId: order.shopKartOrderId, razorpay_order_id: order.razorpayOrderId, razorpay_payment_id: payment,
      razorpay_signature: crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${order.razorpayOrderId}|${payment}`).digest('hex') };
  }
  try {
    await Customer.init();
    await expectStatus('/customers/register', 'POST', { fullName: 'Lab Tester', email: 'lab6@example.com', password: 'test12345', phone: address.phone }, 201);
    cookie = (await request('/customers/login', 'POST', { email: 'lab6@example.com', password: 'test12345' })).cookie;
    const user = await Customer.findOne({ email: 'lab6@example.com' });
    const product = await Product.create({ name: 'Test Keyboard', description: 'Lab test', price: 199.95, category: 'Electronics', image: 'https://example.com/test.png', stock: 5 });
    await t.test('all order routes require authentication', async () => {
      for (const [path, method] of [['/orders', 'GET'], [`/orders/${product.id}`, 'GET'], ['/orders/create-payment-order', 'POST'], ['/orders/verify-payment', 'POST'], [`/orders/${product.id}/status`, 'PATCH']]) await expectStatus(path, method, method === 'GET' ? undefined : {}, 401, '');
    });
    await t.test('shipping and empty-cart validation', async () => {
      for (const shippingAddress of [undefined, {}, { ...address, city: '  ' }, { ...address, phone: 'abc' }, { ...address, pincode: '123' }, { ...address, fullName: 10 }]) await expectStatus('/orders/create-payment-order', 'POST', { shippingAddress }, 400);
      await expectStatus('/orders/create-payment-order', 'POST', { shippingAddress: address }, 400);
    });
    await expectStatus(`/cart/${product.id}`, 'POST', {}, 200);
    await expectStatus(`/cart/${product.id}`, 'POST', {}, 200);
    await t.test('revalidate current stock and deleted products', async () => {
      await Product.updateOne({ _id: product._id }, { stock: 1 });
      await expectStatus('/orders/create-payment-order', 'POST', { shippingAddress: address }, 400);
      await Product.updateOne({ _id: product._id }, { stock: 5 });
      await Customer.updateOne({ _id: user._id }, { $push: { cart: { product: new mongoose.Types.ObjectId(), quantity: 1 } } });
      await expectStatus('/orders/create-payment-order', 'POST', { shippingAddress: address }, 400);
      await Customer.updateOne({ _id: user._id }, { $pull: { cart: { product: { $ne: product._id } } } });
    });
    await t.test('gateway failure preserves cart and persists failed status', async () => {
      gatewayFails = true;
      await expectStatus('/orders/create-payment-order', 'POST', { shippingAddress: address }, 502);
      gatewayFails = false;
      assert.equal((await Customer.findById(user._id)).cart[0].quantity, 2);
      assert.equal((await Order.findOne()).paymentStatus, 'FAILED');
    });
    const pending = await expectStatus('/orders/create-payment-order', 'POST', { shippingAddress: address, totalAmount: 1, items: [] }, 201);
    await t.test('server total, paise, pending status and secret protection', async () => {
      assert.equal(pending.amount, 39990);
      assert.equal(gatewayRequest.amount, 39990);
      assert.equal(gatewayRequest.currency, 'INR');
      assert.equal(gatewayRequest.receipt, pending.shopKartOrderId);
      assert.ok(!JSON.stringify(pending).includes(process.env.RAZORPAY_KEY_SECRET));
      const order = (await request(`/orders/${pending.shopKartOrderId}`)).data.order;
      assert.equal(order.paymentStatus, 'PENDING');
      assert.equal(order.status, 'PENDING_PAYMENT');
      assert.equal(order.cartVersion, undefined);
      assert.equal((await request('/cart')).data.cart[0].quantity, 2);
    });
    await t.test('fake or mismatched signatures cannot clear the cart', async () => {
      for (const changes of [{ razorpay_signature: '0'.repeat(64) }, { razorpay_signature: 'x' }, { razorpay_order_id: 'order_wrong' }, { razorpay_payment_id: 'pay_wrong' }]) await expectStatus('/orders/verify-payment', 'POST', { ...signature(pending), ...changes }, 400);
      assert.equal((await Order.findById(pending.shopKartOrderId)).paymentStatus, 'PENDING');
      assert.equal((await request('/cart')).data.cart.length, 1);
    });
    await t.test('owned orders only, malformed and missing IDs', async () => {
      await expectStatus('/customers/register', 'POST', { fullName: 'Other Tester', email: 'other@example.com', password: 'test12345', phone: address.phone }, 201);
      const otherCookie = (await request('/customers/login', 'POST', { email: 'other@example.com', password: 'test12345' })).cookie;
      await expectStatus(`/orders/${pending.shopKartOrderId}`, 'GET', undefined, 404, otherCookie);
      await expectStatus('/orders/verify-payment', 'POST', signature(pending), 404, otherCookie);
      assert.equal((await request('/orders', 'GET', undefined, otherCookie)).data.orders.length, 0);
      await expectStatus('/orders/bad-id', 'GET', undefined, 400);
      await expectStatus(`/orders/${new mongoose.Types.ObjectId()}`, 'GET', undefined, 404);
    });
    await t.test('verified payment clears cart, survives product deletion, and replays are safe', async () => {
      const results = await Promise.all([request('/orders/verify-payment', 'POST', signature(pending)), request('/orders/verify-payment', 'POST', signature(pending))]);
      results.forEach(result => { assert.equal(result.status, 200); assert.equal(result.data.order.paymentStatus, 'PAID'); });
      assert.equal((await request('/cart')).data.cart.length, 0);
      await expectStatus(`/cart/${product.id}`, 'POST', {}, 200);
      await expectStatus('/orders/verify-payment', 'POST', signature(pending), 200);
      assert.equal((await request('/cart')).data.cart.length, 1);
      await Product.updateOne({ _id: product._id }, { price: 500 });
      const saved = (await request(`/orders/${pending.shopKartOrderId}`)).data.order;
      assert.equal(saved.items[0].price, 199.95);
      assert.equal(saved.totalAmount, 399.9);
    });
    await t.test('bonus status progression is guarded and callbacks do not regress it', async () => {
      const path = `/orders/${pending.shopKartOrderId}/status`;
      const headers = { 'X-Order-Admin-Token': process.env.ORDER_ADMIN_TOKEN };
      await expectStatus(path, 'PATCH', { status: 'CONFIRMED' }, 403);
      await expectStatus(path, 'PATCH', { status: 'DELIVERED' }, 409, cookie, headers);
      for (const status of ['CONFIRMED', 'SHIPPED', 'DELIVERED']) await expectStatus(path, 'PATCH', { status }, 200, cookie, headers);
      const replay = await expectStatus('/orders/verify-payment', 'POST', signature(pending), 200);
      assert.equal(replay.order.status, 'DELIVERED');
    });
    await t.test('concurrent cart edits survive payment confirmation', async () => {
      const order = await expectStatus('/orders/create-payment-order', 'POST', { shippingAddress: address }, 201);
      await expectStatus(`/cart/${product.id}`, 'POST', {}, 200);
      await expectStatus('/orders/verify-payment', 'POST', signature(order, 'pay_second'), 200);
      assert.equal((await request('/cart')).data.cart[0].quantity, 2);
      await Product.deleteOne({ _id: product._id });
      const saved = (await request(`/orders/${order.shopKartOrderId}`)).data.order;
      assert.equal(saved.items[0].name, 'Test Keyboard');
      assert.equal(saved.items[0].price, 500);
      const history = (await request('/orders')).data.orders;
      assert.equal(history[0]._id, order.shopKartOrderId);
    });
    await t.test('missing and live Razorpay credentials are rejected', async () => {
      const key = process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_ID;
      assert.throws(realGateway, /not configured/);
      process.env.RAZORPAY_KEY_ID = 'rzp_live_forbidden';
      assert.throws(realGateway, /not configured/);
      process.env.RAZORPAY_KEY_ID = key;
    });
  } finally {
    payments.getRazorpay = realGateway;
    await new Promise(resolve => server.close(resolve));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
