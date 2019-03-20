const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const crawledPages = new Schema({
  crawledPages: [],
  prodTitles: [],
}, { timestamps: true });

module.exports = mongoose.model('CrawledPages', crawledPages);