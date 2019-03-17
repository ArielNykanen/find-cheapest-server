const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const symbolSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  logoSvg: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Symbol', symbolSchema);