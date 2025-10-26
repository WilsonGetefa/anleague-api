const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  natural_position: { type: String, enum: ['GK', 'DF', 'MD', 'AT'], required: true },
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
  captain_name: { type: String, required: true, default: 'Unknown Captain' }
}, { strict: 'throw' });

teamSchema.pre('save', function (next) {
  try {
    console.log(`Pre-save hook started for team: ${this.country}, squad length: ${this.squad ? this.squad.length : 0}`);
    
    // Validate squad
    if (!this.squad || this.squad.length !== 23) {
      const error = new Error(`Squad must contain exactly 23 players, got ${this.squad ? this.squad.length : 0}`);
      console.error('Pre-save error:', error.message);
      return next(error);
    }

    // Calculate team rating
    const totalRating = this.squad.reduce((sum, player, index) => {
      if (!player.ratings || !player.natural_position) {
        console.error(`Invalid player at index ${index}:`, player);
        throw new Error(`Invalid player data at index ${index}`);
      }
      const rating = player.ratings[player.natural_position] || 50;
      console.log(`Player ${player.name}: ${player.natural_position} rating = ${rating}`);
      return sum + rating;
    }, 0);
    this.rating = Number((totalRating / this.squad.length).toFixed(2)); // Ensure double
    console.log(`Calculated rating: ${this.rating}, type: ${typeof this.rating}`);

    // Set captain_name
    const captain = this.squad.find(player => player.is_captain);
    this.captain_name = captain ? captain.name : this.squad[0].name || `${this.country} Captain`;
    console.log(`Set captain_name: ${this.captain_name}`);

    next();
  } catch (error) {
    console.error('Pre-save hook failed:', error.message);
    next(error);
  }
});

module.exports = mongoose.model('Team', teamSchema);