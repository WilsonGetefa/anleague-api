const mongoose = require('mongoose');

// ————————————————————————————————————————
// PLAYER SUB-SCHEMA
// ————————————————————————————————————————
const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  natural_position: {
    type: String,
    enum: ['GK', 'DF', 'MD', 'AT'],
    required: true
  },
  ratings: {
    GK: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer for GK rating'
      }
    },
    DF: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer for DF rating'
      }
    },
    MD: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer for MD rating'
      }
    },
    AT: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer for AT rating'
      }
    }
  },
  is_captain: { type: Boolean, default: false },
  goals: { type: Number, default: 0 }
});

// ————————————————————————————————————————
// TEAM SCHEMA
// ————————————————————————————————————————
const teamSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  representative_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  squad: {
    type: [playerSchema],
    validate: {
      validator: arr => arr.length === 23,
      message: 'Squad must contain exactly 23 players'
    }
  },
  players: [
    {
      name: { type: String, required: true },
      position: { type: String },
      number: { type: Number }
    }
  ],
  rating: { type: Number, default: 0.0 },
  manager: { type: String, required: true },
  captain_name: { type: String, required: true, default: 'Unknown Captain' }
}, { strict: 'throw' });

// ————————————————————————————————————————
// PRE-SAVE: Auto-calculate rating & captain
// ————————————————————————————————————————
teamSchema.pre('save', function (next) {
  try {
    console.log(`Pre-save: ${this.country}, squad: ${this.squad?.length || 0} players`);

    if (!this.squad || this.squad.length !== 23) {
      return next(new Error(`Squad must have 23 players, got ${this.squad?.length || 0}`));
    }

    // Calculate average natural position rating
    const totalRating = this.squad.reduce((sum, player) => {
      const pos = player.natural_position;
      const rating = player.ratings[pos] || 50;
      return sum + rating;
    }, 0);

    this.rating = Number((totalRating / 23).toFixed(2));
    console.log(`Rating calculated: ${this.rating}`);

    // Set captain name
    const captain = this.squad.find(p => p.is_captain);
    this.captain_name = captain?.name || this.squad[0]?.name || `${this.country} Captain`;
    console.log(`Captain: ${this.captain_name}`);

    next();
  } catch (err) {
    console.error('Pre-save error:', err.message);
    next(err);
  }
});

// ————————————————————————————————————————
// EXPORT MODEL
// ————————————————————————————————————————
module.exports = mongoose.model('Team', teamSchema);