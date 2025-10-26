const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true }],
  bracket: {
    quarterfinals: [{
      match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
      team1_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      team2_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
    }],
    semifinals: [{
      match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
      team1_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      team2_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
    }],
    final: [{
      match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
      team1_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      team2_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
    }]
  },
  status: { type: String, enum: ['quarterfinals', 'semifinals', 'final', 'completed'], required: true },
  __v: Number
});

module.exports = mongoose.model('Tournament', tournamentSchema);