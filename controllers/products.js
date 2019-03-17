const Product = require('../models/product');

exports.getProducts = async (req, res, next) => {
  console.log(req);
  
  const products = await Product.find();
  res.status(200).json({ products: products });
}
