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
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        error: 'Need at least 8 teams',
        message: null
      });
    }

    const shuffled = [...teams].sort(() => 0.5 - Math.random());
    const validTeams = shuffled.slice(0, 8).filter(team => team._id && team._id.toString().length === 24); // Ensure valid ObjectId
    if (validTeams.length < 8) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        error: 'Not enough valid teams to pair for quarterfinals',
        message: null
      });
    }

    const quarterfinals = [];
    for (let i = 0; i < 8; i += 2) {
      const team1 = validTeams[i];
      const team2 = validTeams[i + 1];
      if (!team1._id || !team2._id) {
        console.error('Invalid team IDs at index', i, 'or', i + 1, 'Teams:', validTeams.map(t => t.country));
        return res.render('admin_dashboard', {
          title: 'Admin Dashboard',
          username: req.user.username,
          error: 'Invalid team data detected',
          message: null
        });
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
      status: 'quarterfinals'
    });
    await tournament.save();
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      message: 'Tournament started successfully',
      error: null
    });
  } catch (err) {
    console.error('Start tournament error:', err.message);
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      error: 'Failed to start tournament',
      message: null
    });
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