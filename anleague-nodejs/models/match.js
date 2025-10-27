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
  extra_time_score: {
    team1: { type: Number, default: 0 },
    team2: { type: Number, default: 0 }
  },
  penalty_outcome: {
    team1: { type: Number, default: 0 }, // Penalty kicks scored
    team2: { type: Number, default: 0 }
  },
  goal_scorers: [goalScorerSchema],
  type: { type: String, enum: ['played', 'simulated'], required: true },
  commentary: { type: String },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  tournament_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true } // New field
}, { timestamps: true }); // Add timestamps for createdAt and updatedAt

module.exports = mongoose.model('Match', matchSchema);