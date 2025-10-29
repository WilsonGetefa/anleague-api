// models/team.js
const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  natural_position: { type: String, enum: ['GK', 'DF', 'MD', 'AT'], required: true },
  ratings: {
    GK: { type: Number, default: 50 },
    DF: { type: Number, default: 50 },
    MD: { type: Number, default: 50 },
    AT: { type: Number, default: 50 }
  },
  is_captain: { type: Boolean, default: false },
  goals: { type: Number, default: 0 }
}, { _id: false, timestamps: false });  // ← DISABLE _id

const teamSchema = new mongoose.Schema({
  country: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  manager: { type: String, required: true },
  representative_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  squad: {
    type: [playerSchema],
    validate: [v => v.length === 23, 'Squad must have exactly 23 players']
  },
  captain_name: { type: String, required: true },
  rating: { type: Number, required: true },
  players: { type: Array, default: [] }
});

// ————————————————————————
// PRE-SAVE HOOK: Auto-fill rating & captain_name
// ————————————————————————
teamSchema.pre('save', function (next) {
  if (!this.squad || this.squad.length !== 23) {
    return next(new Error('Squad must have exactly 23 players'));
  }

  // 1. Calculate team rating
  const total = this.squad.reduce((sum, player) => {
    const pos = player.natural_position;
    return sum + (player.ratings[pos] || 50);
  }, 0);
  this.rating = Number((total / 23).toFixed(2));

  // 2. Set captain name
  const captain = this.squad.find(p => p.is_captain);
  this.captain_name = captain ? captain.name : this.squad[0]?.name || 'Unknown';

  next();
});

module.exports = mongoose.model('Team', teamSchema);