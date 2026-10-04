const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

exports.getWishlist = async (req, res) => {
  const customer = await Customer.findById(req.user._id).populate({
    path: 'wishlist', select: 'name price category image stock'
  });
  res.json({ success: true, count: customer.wishlist.length, wishlist: customer.wishlist });
};

exports.validateId = (req, res, next) => {
  if (!mongoose.isObjectIdOrHexString(req.params.productId)) {
    return res.status(400).json({ success: false, message: 'Invalid product ID' });
  }
  next();
};

exports.addProduct = async (req, res) => {
  const { productId } = req.params;
  if (!await Product.exists({ _id: productId })) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  // Conditional update prevents duplicates even when two requests arrive together.
  const result = await Customer.updateOne(
    { _id: req.user._id, wishlist: { $ne: productId } },
    { $addToSet: { wishlist: productId }, $inc: { __v: 1 } }
  );
  if (!result.modifiedCount) return res.status(409).json({ success: false, message: 'Product already in wishlist' });
  res.status(201).json({ success: true, message: 'Product added to wishlist' });
};

exports.removeProduct = async (req, res) => {
  const result = await Customer.updateOne(
    { _id: req.user._id, wishlist: req.params.productId },
    { $pull: { wishlist: req.params.productId }, $inc: { __v: 1 } }
  );
  if (!result.modifiedCount) return res.status(404).json({ success: false, message: 'Product not in wishlist' });
  res.json({ success: true, message: 'Product removed from wishlist' });
};

// Lab 04 bonus: flip membership in one database operation, including concurrent clicks.
exports.toggleProduct = async (req, res) => {
  const productId = new mongoose.Types.ObjectId(req.params.productId);
  if (!await Product.exists({ _id: productId })) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  const wishlist = { $ifNull: ['$wishlist', []] };
  const customer = await Customer.findByIdAndUpdate(req.user._id, [{
    $set: {
      wishlist: { $cond: [
        { $in: [productId, wishlist] },
        { $filter: { input: wishlist, as: 'product', cond: { $ne: ['$$product', productId] } } },
        { $concatArrays: [wishlist, [productId]] }
      ] },
      __v: { $add: [{ $ifNull: ['$__v', 0] }, 1] }
    }
  }], { returnDocument: 'after', updatePipeline: true });
  if (!customer) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const saved = customer.wishlist.some(id => id.equals(productId));
  res.json({ success: true, saved, message: saved ? 'Product added to wishlist' : 'Product removed from wishlist' });
};
