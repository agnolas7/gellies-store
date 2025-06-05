const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  photo: String, // for profile photo
  role: { type: String, default: "user" }, // "user" or "admin"
});

module.exports = mongoose.model("User", userSchema);
