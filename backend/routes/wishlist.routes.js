const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/wishlist.controller');

router.use(auth);
router.get('/', controller.getWishlist);
router.post('/:productId', controller.validateId, controller.addProduct);
router.delete('/:productId', controller.validateId, controller.removeProduct);
router.patch('/:productId/toggle', controller.validateId, controller.toggleProduct);
module.exports = router;
