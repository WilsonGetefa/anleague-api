// models/team.js
const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  natural_position: { type: String, enum: ['GK', 'DF', 'MD', 'AT'], required: true },
  ratings: {
    GK: { type: Number, required: true },
    DF: { type: Number, required: true },
    MD: { type: Number, required: true },
    AT: { type: Number, required: true },
  },
  is_captain: { type: Boolean, default: false },
  goals: { type: Number, default: 0 },
  // DO NOT disable _id — keep it!
}, { timestamps: false });

const teamSchema = new mongoose.Schema({
  country: { type: String, required: true, unique: true },
  manager: { type: String, required: true },
  representative_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  squad: {
    type: [playerSchema],
    validate: [v => v.length === 23, 'Squad must have exactly 23 players']
  },
  captain_name: { type: String, required: true },
  rating: { type: Number, required: true },
});

module.exports = mongoose.model('Team', teamSchema);