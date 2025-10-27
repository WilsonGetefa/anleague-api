const mongoose = require('mongoose');

const pastTournamentSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
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
  status: { type: String, enum: ['completed'], default: 'completed' }
});

module.exports = mongoose.model('PastTournament', pastTournamentSchema);