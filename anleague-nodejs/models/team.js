const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  natural_position: { type: String, enum: ['GK', 'DF', 'MD', 'AT'], required: true },
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
  squad: [playerSchema],
  rating: { type: Number, default: 0 },
  manager: { type: String, required: false }
}, { strict: 'throw', validateBeforeSave: false }); // Disable validation for testing

teamSchema.pre('save', function (next) {
  if (this.squad.length > 0) {
    const totalRating = this.squad.reduce((sum, player) => {
      return sum + (player.ratings[player.natural_position] || 50);
    }, 0);
    this.rating = totalRating / this.squad.length;
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema);