const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const visitTrackerSchema = new Schema({
  visits: Number,
  date: String
}, { timestamps: true });

module.exports = mongoose.model('VisitTracker', visitTrackerSchema);