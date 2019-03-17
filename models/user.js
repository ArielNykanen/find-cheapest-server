const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  lastname: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  customerType: {
    type: String,
    required: true
  },
  cart: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        title: { type: String, required: true },
        price: { type: String, required: true },
        image: { type: String, required: true },
        productInStock: { type: Number, required: true },
      }
  ]
  ,
  orders:[{
      orderStatus: String,
      items: [],
      price: Number,
      taxes: Number,
      totalPrice: Number,
      createdAt: String,
      updatedAt: String,
    }],
  canceledOrders:[{
      orderStatus: String,
      items: [],
      price: Number,
      taxes: Number,
      totalPrice: Number,
      createdAt: String,
      updatedAt: String,
    }],
  anotherPhone: {
    type: String,
  },
  authToken: {
    type: String,
  },
  role: String
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);