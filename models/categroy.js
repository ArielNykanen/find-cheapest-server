const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const categorySchema = new Schema({
  title: {
    type: String,
    index: true,
    required: true
  },
  relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  subCategories: [
    { type: Schema.Types.ObjectId, ref: 'SubCategory' }
  ],
  image: {
    type: String,
    required: true
  }
}, { timestamps: true });

const subCategorySchema = new Schema({
  title: {
    type: String,
    index: true,
    required: true
  },
  relatedProducts: [
    { type: Schema.Types.ObjectId, ref: 'Product' }
  ],
  category: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    }
  ],
  image: {
    type: String,
    required: true
  }
}, { timestamps: true });

const category = mongoose.model('Category', categorySchema);
const subCategory = mongoose.model('SubCategory', subCategorySchema);
exports.category = category;
exports.subCategory = subCategory;