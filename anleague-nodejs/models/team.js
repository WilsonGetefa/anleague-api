const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  natural_position: { type: String, enum: ['GK', 'DF', 'MD', 'AT'], required: true },
  ratings: {
    GK: { type: Number, min: 0, max: 100 },
    DF: { type: Number, min: 0, max: 100 },
    MD: { type: Number, min: 0, max: 100 },
    AT: { type: Number, min: 0, max: 100 }
  },
  is_captain: { type: Boolean, default: false }
});

const teamSchema = new mongoose.Schema({
  country: { type: String, required: true, unique: true },
  manager: { type: String, required: true },
  representative_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  squad: [playerSchema],
  captain_name: { type: String, required: true },
  rating: { type: Number, default: 0 } // Average of natural position ratings
});

module.exports = mongoose.model('Team', teamSchema);