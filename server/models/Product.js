const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  size: String,
  barcode: String,
  price: String,
  photo: String,
});

module.exports = mongoose.model("Product", productSchema);
