const mongoose = require('mongoose');
const Product = require('../models/product.model');

// POST /products: validate the submitted fields and insert one product.
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body || {};
    // Check text fields and numeric limits before writing to MongoDB.
    if (![name, description, category, image].every(value => typeof value === 'string' && value.trim()) ||
        !Number.isFinite(price) || price <= 0 || !Number.isFinite(stock) || stock < 0) {
      return res.status(400).json({ success: false, message: 'All fields are required, price must be greater than 0, and stock must be at least 0' });
    }
    // Save only the fields specified by the lab; return 201 for successful creation.
    const product = await Product.create({ name, description, price, category, image, stock });
    res.status(201).json(product);
  } catch (error) {
    res.status(error.name === 'ValidationError' ? 400 : 500).json({ success: false, message: 'Unable to create product' });
  }
};

// GET /products: combine optional search, category and price-sorting parameters.
exports.getProducts = async (req, res) => {
  try {
    // An empty query matches all products. Add conditions only when supplied.
    const query = {};
    if (typeof req.query.search === 'string' && req.query.search) {
      // Match search text literally, including regular-expression symbols.
      query.name = { $regex: req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }
    // Adding category to the same query applies both filters together.
    if (typeof req.query.category === 'string' && req.query.category) query.category = req.query.category;
    // Return only the fields needed by product cards; _id is included automatically.
    let productsQuery = Product.find(query).select('name price category image stock');
    // Lab 03 bonus: 1 sorts low to high; -1 sorts high to low.
    if (req.query.sort === 'price_asc') productsQuery = productsQuery.sort({ price: 1 });
    if (req.query.sort === 'price_desc') productsQuery = productsQuery.sort({ price: -1 });
    // Execute the database query and return the matching count and products.
    const products = await productsQuery;
    res.json({ success: true, count: products.length, products });
  } catch {
    res.status(500).json({ success: false, message: 'Unable to load products' });
  }
};

// GET /products/:id: read the ID from the URL and return one product.
exports.getProduct = async (req, res) => {
  // Reject malformed IDs before querying MongoDB.
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid product ID' });
  }
  try {
    // Exclude __v, the internal Mongoose version field. A missing document gives 404.
    const product = await Product.findById(req.params.id).select('-__v');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json(product);
  } catch {
    res.status(500).json({ success: false, message: 'Unable to load product' });
  }
};
