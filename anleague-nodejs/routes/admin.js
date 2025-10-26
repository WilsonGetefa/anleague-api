const express = require('express');
const router = express.Router();
const Tournament = require('../models/tournament');
const Team = require('../models/team');
const Match = require('../models/match');
const matchController = require('../controllers/matchController');

router.post('/start', async (req, res) => {
  try {
    const teams = await Team.find();
    if (teams.length < 8) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        error: 'Need 8 teams to start the tournament'
      });
    }
    
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
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      message: 'Tournament started successfully'
    });
  } catch (err) {
    console.error('Start tournament error:', err.message);
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      error: 'Failed to start tournament'
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
      message: 'Tournament reset successfully'
    });
  } catch (err) {
    console.error('Restart tournament error:', err.message);
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      error: 'Failed to reset tournament'
    });
  }
});

module.exports = router;