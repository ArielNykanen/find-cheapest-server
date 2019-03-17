const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  orderStatus: {
    type: String,
    required: true
  },
  items: [],
  price: {
    type: Number,
    required: true
  },
  taxes: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  }
  

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);