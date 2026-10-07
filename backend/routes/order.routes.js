const router = require('express').Router();
const controller = require('../controllers/order.controller');
router.use(require('../middlewares/auth.middleware'));
router.post('/create-payment-order', controller.createPaymentOrder);
router.post('/verify-payment', controller.verifyPayment);
router.get('/', controller.getOrders);
router.get('/:id', controller.getOrder);
router.patch('/:id/status', controller.updateStatus);
module.exports = router;
