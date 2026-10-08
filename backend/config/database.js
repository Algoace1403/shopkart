const mongoose = require('mongoose');

let connectionPromise;
module.exports = async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000
    }).then(async () => {
      await require('../models/customer.model').init();
    }).catch(error => {
      connectionPromise = undefined;
      throw error;
    });
  }
  await connectionPromise;
};
