const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mainPageSchema = new Schema({
  supportNum: String,
  firstHeader: String,
  topBanner: String,
  secondHeader: String,
  thirdHeader: String,
})

module.exports = mongoose.model('mainPage', mainPageSchema);