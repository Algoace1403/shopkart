const router = require('express').Router();
const controller = require('../controllers/customer.controller');
const auth = require('../middlewares/auth.middleware');

// These public routes create an account and log in. Prefix: /customers.
router.post('/register', controller.registerCustomer);
router.post('/login', controller.loginCustomer);
// auth runs first on these routes; the controller runs only after authentication.
router.get('/me', auth, controller.getProfile);
router.post('/logout', auth, controller.logoutCustomer);
router.patch('/change-password', auth, controller.changePassword);
// Make these routes available to index.js.
module.exports = router;
