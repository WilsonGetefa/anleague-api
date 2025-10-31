const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  country: { type: String },
  role: { type: String, enum: ['representative', 'admin'], default: 'representative' }
});

module.exports = mongoose.model('User', userSchema);