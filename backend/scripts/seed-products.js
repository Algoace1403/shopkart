const mongoose = require('mongoose');
const Product = require('../models/product.model');
const Customer = require('../models/customer.model');
const products = require('../data/products.json');
const preview = process.argv.includes('--preview');
const uri = preview ? 'mongodb://127.0.0.1:27017/shopkart_catalog_preview' : process.env.CATALOG_MONGODB_URI;

(async () => {
  if (!uri) throw new Error('Provide CATALOG_MONGODB_URI explicitly, or use --preview for the isolated local database.');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    for (const product of products) {
      await new Product(product).validate();
      await Product.updateOne({ name: product.name, category: product.category }, { $setOnInsert: product }, { upsert: true, runValidators: true });
    }
    if (preview && !await Customer.exists({ email: 'preview@shopkart.test' })) {
      await Customer.create({ fullName: 'ShopKart Preview', email: 'preview@shopkart.test', phone: '9876543210', password: 'ShopkartPreview123!' });
    }
    console.log(JSON.stringify({ database: mongoose.connection.name, categories: await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]) }, null, 2));
  } finally { await mongoose.disconnect(); }
})().catch(error => { console.error(error.name + ': product seeding failed. Check the selected database and connection.'); process.exitCode = 1; });
