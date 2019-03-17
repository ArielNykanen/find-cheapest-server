const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productTrackerSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  title: String,
  infoClicks: Number,
  addedToCart: Number,
  ordered: Number,
  votes: [{
    rated: Number,
  }],

}, { timestamps: true });

module.exports = mongoose.model('ProductTracker', productTrackerSchema);