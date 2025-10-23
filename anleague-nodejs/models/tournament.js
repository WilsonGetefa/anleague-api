const mongoose = require('mongoose');

const matchRefSchema = new mongoose.Schema({
  match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
  team1_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  team2_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
});

const tournamentSchema = new mongoose.Schema({
  status: { type: String, enum: ['quarterfinals', 'semifinals', 'final', 'completed'], default: 'quarterfinals' },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  bracket: {
    quarterfinals: [matchRefSchema],
    semifinals: [matchRefSchema],
    final: [matchRefSchema]
  }
});

module.exports = mongoose.model('Tournament', tournamentSchema);