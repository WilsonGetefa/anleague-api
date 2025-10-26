const express = require('express');
const router = express.Router();
const Tournament = require('../models/tournament');
const Team = require('../models/team');
const Match = require('../models/match');
const matchController = require('../controllers/matchController');

router.post('/start', async (req, res) => {
  try {
    const teams = await Team.find().lean();
    if (teams.length < 8) {
      return res.status(400).json({ error: 'Need at least 8 teams' });
    }

    const shuffled = [...teams].sort(() => 0.5 - Math.random());
    const validTeams = shuffled.slice(0, 8).filter(team => team._id); // Ensure valid _id
    if (validTeams.length < 8) {
      return res.status(400).json({ error: 'Not enough valid teams to pair for quarterfinals' });
    }

    const quarterfinals = [];
    for (let i = 0; i < 8; i += 2) {
      const team1 = validTeams[i];
      const team2 = validTeams[i + 1];
      if (!team1._id || !team2._id) {
        console.error('Invalid team IDs at index', i, 'or', i + 1, 'Teams:', validTeams.map(t => t.country));
        return res.status(400).json({ error: 'Invalid team data detected' });
      }
      const match = new Match({
        stage: 'quarterfinal',
        team1_id: team1._id,
        team2_id: team2._id,
        type: 'simulated',
        status: 'pending'
      });
      await match.save();
      quarterfinals.push({ match_id: match._id, team1_id: team1._id, team2_id: team2._id });
    }

    const tournament = new Tournament({
      teams: validTeams.map(t => t._id),
      bracket: { quarterfinals, semifinals: [], final: [] },
      status: 'active'
    });
    await tournament.save();
    res.json({ message: 'Tournament started' });
  } catch (err) {
    console.error('Start tournament error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/simulate', matchController.simulateMatch);
router.post('/play', matchController.playMatch);

router.post('/restart', async (req, res) => {
  try {
    await Tournament.deleteMany({});
    await Match.deleteMany({});
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      message: 'Tournament reset successfully',
      error: null
    });
  } catch (err) {
    console.error('Restart tournament error:', err.message);
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      error: 'Failed to reset tournament',
      message: null
    });
  }
});

module.exports = router;