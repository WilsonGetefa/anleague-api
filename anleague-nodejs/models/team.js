// models/team.js
const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  natural_position: { type: String, enum: ['GK', 'DF', 'MD', 'AT'], required: true },
  ratings: {
    GK: { type: Number, min: 1, max: 99, required: true },
    DF: { type: Number, min: 1, max: 99, required: true },
    MD: { type: Number, min: 1, max: 99, required: true },
    AT: { type: Number, min: 1, max: 99, required: true },
  },
  is_captain: { type: Boolean, default: false },
  goals: { type: Number, default: 0 },
});

const teamSchema = new mongoose.Schema({
  country: { type: String, required: true, unique: true },
  manager: { type: String, required: true },               // required by validator
  representative_id: {                                    // ONLY this field
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  squad: {
    type: [playerSchema],
    validate: [v => v.length === 23, 'Squad must contain exactly 23 players'],
  },
  captain_name: { type: String, required: true },
  rating: { type: Number, required: true, min: 0 },
});

module.exports = mongoose.model('Team', teamSchema);