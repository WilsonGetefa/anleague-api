const express = require('express');
const router = express.Router();
const Team = require('../models/team');
const User = require('../models/user');
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware/auth');

router.post('/autofill', authMiddleware, async (req, res) => {
  const { country } = req.body;
  const { user } = req;
  try {
    if (!user) {
      console.log('No authenticated user');
      return res.redirect('/login');
    }
    console.log('Team autofill attempt:', { user: user.username, country, userId: user.id });

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(user.id)) {
      console.log('Invalid userId:', user.id);
      return res.render('dashboard', {
        title: 'Dashboard',
        username: user.username,
        country: user.country,
        role: user.role,
        error: 'Invalid user ID',
        hasTeam: false
      });
    }

    // Check if user exists
    const userExists = await User.findById(user.id);
    if (!userExists) {
      console.log('User not found:', user.id);
      return res.render('dashboard', {
        title: 'Dashboard',
        username: user.username,
        country: user.country,
        role: user.role,
        error: 'User not found',
        hasTeam: false
      });
    }

    // Check country match
    if (!country || user.country !== country) {
      console.log('Country mismatch or missing:', { userCountry: user.country, requestedCountry: country });
      return res.render('dashboard', {
        title: 'Dashboard',
        username: user.username,
        country: user.country,
        role: user.role,
        error: 'Can only create team for your country',
        hasTeam: false
      });
    }

    // Check for existing team
    const existingTeam = await Team.findOne({ country });
    if (existingTeam) {
      console.log('Team already exists:', country);
      return res.render('dashboard', {
        title: 'Dashboard',
        username: user.username,
        country: user.country,
        role: user.role,
        error: `Team for ${country} already exists`,
        hasTeam: true
      });
    }

    const squad = generateDefaultPlayers(country);
    console.log('Generated squad:', JSON.stringify(squad, null, 2));

    const team = new Team({
      country,
      userId: user.id,
      representative_id: user.id, // Matches userId
      squad,
      rating: calculateTeamRating(squad),
      manager: `${user.username} Manager`,
      captain_name: squad.find(player => player.is_captain)?.name || squad[0].name // Set captain_name
    });

    console.log('Team document to save:', JSON.stringify(team.toObject(), null, 2));

    await team.validate();
    await team.save();
    console.log(`Team created: ${country} by ${user.username}`);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Team creation error:', err.message, err.stack, 'Details:', JSON.stringify(err, null, 2));
    let errorMessage = 'Failed to create team';
    if (err.code === 11000) {
      errorMessage = `Team for ${country} already exists`;
    } else if (err.name === 'ValidationError') {
      errorMessage = `Validation failed: ${Object.values(err.errors).map(e => e.message).join(', ')}`;
    } else {
      errorMessage = `Error: ${err.message}`;
    }
    return res.render('dashboard', {
      title: 'Dashboard',
      username: user.username,
      country: user.country,
      role: user.role,
      error: errorMessage,
      hasTeam: await Team.findOne({ country }).then(t => !!t)
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const teams = await Team.find()
      .select('country manager rating squad captain_name representative_id')
      .populate('userId', 'username')
      .populate('representative_id', 'username')
      .sort({ rating: -1 });
    console.log('Fetched teams:', teams.length);
    res.render('teams', { 
      title: 'Teams', 
      teams, 
      user: req.user,
      error: null 
    });
  } catch (err) {
    console.error('Teams fetch error:', err.message);
    res.render('teams', { 
      title: 'Teams', 
      teams: [], 
      user: req.user, 
      error: 'Unable to fetch teams' 
    });
  }
});

function generateDefaultPlayers(country) {
  const positions = ['GK', 'DF', 'DF', 'DF', 'DF', 'MD', 'MD', 'MD', 'AT', 'AT', 'AT'];
  const players = positions.map((position, index) => ({
    name: `${country} Player ${index + 1}`,
    natural_position: position,
    ratings: {
      GK: position === 'GK' ? 80 : 50,
      DF: position === 'DF' ? 80 : 50,
      MD: position === 'MD' ? 80 : 50,
      AT: position === 'AT' ? 80 : 50
    },
    is_captain: index === 0,
    goals: 0
  }));
  return players;
}

function calculateTeamRating(squad) {
  if (!squad.length) return 0.0;
  const totalRating = squad.reduce((sum, player) => {
    return sum + (player.ratings[player.natural_position] || 50);
  }, 0);
  return parseFloat((totalRating / squad.length).toFixed(2));
}

module.exports = router;