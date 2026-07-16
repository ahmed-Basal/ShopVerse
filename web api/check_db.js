const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: 'env.config' });

const Product = require('./models/productModel');
const Category = require('./models/categoryModel');
const dbConnection = require('./config/database');

async function run() {
  await dbConnection();
  const prodCount = await Product.countDocuments();
  const catCount = await Category.countDocuments();
  console.log('Total Products in DB:', prodCount);
  console.log('Total Categories in DB:', catCount);
  
  if (prodCount > 0) {
    const sample = await Product.findOne().populate('category');
    console.log('Sample Product:', sample.title);
    console.log('Sample Product Category:', sample.category);
  }
  
  mongoose.connection.close();
}

run();
