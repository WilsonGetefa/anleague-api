const express = require('express');
const router = express.Router();
const Tournament = require('../models/tournament');
const Match = require('../models/match');
const PastTournament = require('../models/pastTournament'); // Ensure this line is present
const Team = require('../models/team');
const auth = require('../middleware/auth').authMiddleware;

router.get('/', async (req, res) => {
  try {
    // Fetch current tournament with populated match data, handling null case
    const currentTournament = await Tournament.findOne()
      .populate('bracket.quarterfinals.match_id')
      .populate('bracket.semifinals.match_id')
      .populate('bracket.final.match_id');
    let currentMatchData = null;
    if (currentTournament && currentTournament.bracket) {
      currentMatchData = {
        status: currentTournament.status, // Add status
        quarterfinals: currentTournament.bracket.quarterfinals?.map(qf => qf.match_id) || [],
        semifinals: currentTournament.bracket.semifinals?.map(sf => sf.match_id) || [],
        final: currentTournament.bracket.final?.map(f => f.match_id) || []
      };
    }

    // Fetch past tournaments with populated final match and team data
    const pastTournaments = await PastTournament.find()
      .populate('bracket.final.match_id')
      .populate('bracket.final.team1_id', 'country')
      .populate('bracket.final.team2_id', 'country');
    const pastWinners = pastTournaments
      .map(t => {
        const finalMatch = t.bracket.final[0]?.match_id;
        if (finalMatch) {
          const winnerTeam = finalMatch.score.team1 > finalMatch.score.team2 ? t.bracket.final[0].team1_id : t.bracket.final[0].team2_id;
          return {
            year: t.year,
            country: winnerTeam ? winnerTeam.country || 'N/A' : 'N/A'
          };
        }
        return { year: t.year, country: 'N/A' };
      })
      .slice(-3); // Last 3 winners

    // Calculate total goals
    const totalGoals = await Match.aggregate([
      { $unwind: '$goal_scorers' },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]).then(result => result[0]?.total || 0);

    res.render('index', {
      title: 'African Nations League',
      currentTournament: currentMatchData,
      pastWinners,
      totalGoals,
      user: req.user // Ensure this is passed
    });
  } catch (err) {
    console.error('Index error:', err.message, err.stack);
    res.render('index', {
      title: 'African Nations League',
      currentTournament: null,
      pastWinners: [],
      totalGoals: 0,
      user: req.user // Ensure this is passed
    });
  }
});

router.get('/dashboard', auth, async (req, res) => {
  try {
    const team = await Team.findOne({ representative_id: req.user._id });
    if (!team) {
      return res.render('dashboard', {
        title: 'Dashboard',
        user: req.user,
        hasTeam: false,
        country: req.user.country,
        team: null
      });
    }

    res.render('dashboard', {
      title: 'Team Dashboard',
      user: req.user,
      team,
      message: req.query.message,
      error: req.query.error,
      team: null
    });
  } catch (err) {
    res.render('dashboard', { title: 'Dashboard', error: 'Failed to load team' });
  }
});

module.exports = router;