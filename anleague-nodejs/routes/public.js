const express = require('express');
const router = express.Router();
const Tournament = require('../models/tournament');
const Team = require('../models/team');
const Match = require('../models/match');
const matchController = require('../controllers/matchController');

// Start tournament (admin-only, kept for reference)
router.post('/start', async (req, res) => {
  try {
    const teams = await Team.find();
    if (teams.length < 8) return res.status(400).json({ error: 'Need 8 teams' });

    const shuffled = teams.sort(() => 0.5 - Math.random()).slice(0, 8);
    const quarterfinals = [];
    for (let i = 0; i < 8; i += 2) {
      const match = new Match({
        stage: 'quarterfinal',
        team1_id: shuffled[i]._id,
        team2_id: shuffled[i + 1]._id,
        type: 'simulated'
      });
      await match.save();
      quarterfinals.push({ match_id: match._id, team1_id: shuffled[i]._id, team2_id: shuffled[i + 1]._id });
    }

    const tournament = new Tournament({ teams: shuffled.map(t => t._id), bracket: { quarterfinals } });
    await tournament.save();
    res.json({ message: 'Tournament started' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simulate match (admin-only)
router.post('/simulate', matchController.simulateMatch);

// Play match with AI (admin-only)
router.post('/play', matchController.playMatch);

// Reset tournament (admin-only)
router.post('/restart', async (req, res) => {
  try {
    await Tournament.deleteMany({});
    await Match.deleteMany({});
    res.json({ message: 'Tournament reset' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tournament bracket (public)
router.get('/bracket', async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ status: { $ne: 'completed' } })
      .populate({
        path: 'teams',
        select: 'country'
      })
      .populate({
        path: 'bracket.quarterfinals.match_id',
        populate: [
          { path: 'team1_id', select: 'country' },
          { path: 'team2_id', select: 'country' }
        ]
      })
      .populate({
        path: 'bracket.semifinals.match_id',
        populate: [
          { path: 'team1_id', select: 'country' },
          { path: 'team2_id', select: 'country' }
        ]
      })
      .populate({
        path: 'bracket.final.match_id',
        populate: [
          { path: 'team1_id', select: 'country' },
          { path: 'team2_id', select: 'country' }
        ]
      });

    if (req.query.format === 'json') {
      return res.json({ tournament });
    }

    if (!tournament) {
      return res.render('bracket', { title: 'Tournament Bracket', tournament: null, message: 'No active tournament' });
    }

    res.render('bracket', { title: 'Tournament Bracket', tournament });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get rankings (public)
router.get('/rankings', async (req, res) => {
  try {
    const matches = await Match.find({ type: { $in: ['simulated', 'played'] } })
      .populate('team1_id', 'country')
      .populate('team2_id', 'country');

    // Aggregate goal scorers
    const goalScorers = {};
    matches.forEach(match => {
      match.goal_scorers.forEach(goal => {
        const player = goal.player_name;
        const team = goal.team === 'team1' ? match.team1_id.country : match.team2_id.country;
        if (!goalScorers[player]) {
          goalScorers[player] = { name: player, team, goals: 0 };
        }
        goalScorers[player].goals += 1;
      });
    });

    // Convert to array and sort by goals
    const rankings = Object.values(goalScorers).sort((a, b) => b.goals - a.goals);

    if (req.query.format === 'json') {
      return res.json({ rankings });
    }

    res.render('rankings', { title: 'Goal Scorers Rankings', rankings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;