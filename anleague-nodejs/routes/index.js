const express = require('express');
const router = express.Router();
const Tournament = require('../models/tournament');
const Match = require('../models/match');
const Team = require('../models/team');

router.get('/', async (req, res) => {
  try {
    const currentTournament = await Tournament.findOne().populate('bracket.quarterfinals.match_id').populate('bracket.semifinals.match_id').populate('bracket.final.match_id');
    const pastTournaments = await PastTournament.find().populate('bracket.final.match_id').populate('bracket.final.team1_id').populate('bracket.final.team2_id');
    const pastWinners = pastTournaments.map(t => ({
      year: t.year,
      country: t.bracket.final[0].match_id ? (t.bracket.final[0].match_id.score.team1 > t.bracket.final[0].match_id.score.team2 ? t.bracket.final[0].team1_id.country : t.bracket.final[0].team2_id.country) : 'N/A'
    })).slice(-3); // Last 3 winners

    const totalGoals = await Match.aggregate([
      { $unwind: '$goal_scorers' },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]).then(result => result[0]?.total || 0);

    res.render('index', {
      title: 'African Nations League',
      currentTournament,
      pastWinners,
      totalGoals
    });
  } catch (err) {
    console.error('Index error:', err.message);
    res.render('index', {
      title: 'African Nations League',
      currentTournament: null,
      pastWinners: [],
      totalGoals: 0
    });
  }
});

module.exports = router;