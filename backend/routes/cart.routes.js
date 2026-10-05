const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/cart.controller');

router.use(auth);
router.get('/', controller.getCart);
router.post('/:productId', controller.validateId, controller.addProduct);
router.patch('/:productId', controller.validateId, controller.updateQuantity);
router.delete('/:productId', controller.validateId, controller.removeProduct);
module.exports = router;
