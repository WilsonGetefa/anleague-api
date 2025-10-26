const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  natural_position: {
    type: String,
    enum: ['GK', 'DF', 'MD', 'AT'],
    required: true
  },
  ratings: {
    GK: { type: Number, min: 0, max: 100, default: 50 },
    DF: { type: Number, min: 0, max: 100, default: 50 },
    MD: { type: Number, min: 0, max: 100, default: 50 },
    AT: { type: Number, min: 0, max: 100, default: 50 }
  },
  is_captain: { type: Boolean, default: false },
  goals: { type: Number, default: 0 }
});

const teamSchema = new mongoose.Schema({
  country: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  representative_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  squad: {
    type: [playerSchema],
    validate: {
      validator: arr => arr.length === 23,
      message: 'Squad must contain exactly 23 players'
    }
  },
  rating: { type: Number, default: 0.0 },
  manager: { type: String, required: true },
  captain_name: { type: String, required: true }
}, { strict: 'throw' });

teamSchema.pre('save', function (next) {
  if (this.squad && this.squad.length === 23) {
    const total = this.squad.reduce((sum, p) => sum + (p.ratings[p.natural_position] || 50), 0);
    this.rating = parseFloat((total / 23).toFixed(2));

    const captain = this.squad.find(p => p.is_captain);
    this.captain_name = captain ? captain.name : this.squad[0].name;
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema);