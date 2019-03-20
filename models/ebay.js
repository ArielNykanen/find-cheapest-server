const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ebayAffiliateProducts = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: String,
    required: false
  },
  image: {
    type: String,
    required: true
  },
  affiliateLink: {
    type: String,
    required: true
  },
  symbol: String,
  logo: String,
  prodLink: String,
  productClickRate: Number,
  rating: Number,
  relatedKeyWords: String

}, { timestamps: true });

module.exports = mongoose.model('Ebay_products', ebayAffiliateProducts);