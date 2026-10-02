const router = require('express').Router();
const { createProduct, getProducts, getProduct } = require('../controllers/product.controller');
// Product routes are public in Lab 03. index.js adds the /products prefix.
router.post('/', createProduct);
router.get('/', getProducts);
// :id is a URL parameter available to the controller as req.params.id.
router.get('/:id', getProduct);
// Make these routes available to index.js.
module.exports = router;
