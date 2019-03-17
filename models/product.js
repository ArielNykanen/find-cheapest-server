const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  quantity: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subCategory: {
    type: String,
    required: true
  },
  onSale: {
    type: String,
    required: true
  },
  onSaleTitle: {
    type: String,
  },
  showDate: {
    type: String,
    required: true
  },
  saleEndDate: {
    type: String
  },
  lastPrice: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  imageOldPath: {
    type: String,
    required: true
  },
  attachedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  attachedInformation: [{
    title: String,
    info: String
  }],
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);