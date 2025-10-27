const mongoose = require('mongoose');

const goalScorerSchema = new mongoose.Schema({
  player_name: { type: String, required: true },
  minute: { type: Number, min: 1, max: 120 },
  team: { type: String, enum: ['team1', 'team2'] }
});

const matchSchema = new mongoose.Schema({
  stage: { type: String, enum: ['quarterfinal', 'semifinal', 'final'], required: true },
  team1_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  team2_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  score: {
    team1: { type: Number, default: 0 },
    team2: { type: Number, default: 0 }
  },
  goal_scorers: [goalScorerSchema],
  type: { type: String, enum: ['played', 'simulated'], required: true },
  commentary: { type: String }, // For played matches
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' }
});

module.exports = mongoose.model('Match', matchSchema);