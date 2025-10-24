const express = require('express');
const router = express.Router();
const Team = require('../models/team');
const mongoose = require('mongoose');

router.post('/autofill', async (req, res) => {
  const { country } = req.body;
  const { user } = req;
  try {
    console.log('Team autofill attempt:', { user: user.username, country, userId: user.id });

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(user.id)) {
      console.log('Invalid userId:', user.id);
      return res.render('error', { title: 'Error', error: 'Invalid user ID' });
    }

    // Check if user exists
    const userExists = await mongoose.model('User').findById(user.id);
    if (!userExists) {
      console.log('User not found:', user.id);
      return res.render('error', { title: 'Error', error: 'User not found' });
    }

    // Check country match
    if (user.country !== country) {
      console.log('Country mismatch:', { userCountry: user.country, requestedCountry: country });
      return res.render('error', { title: 'Error', error: 'Can only create team for your country' });
    }

    // Check for existing team
    const existingTeam = await Team.findOne({ country });
    if (existingTeam) {
      console.log('Team already exists:', country);
      return res.render('error', { title: 'Error', error: `Team for ${country} already exists` });
    }

    const squad = generateDefaultPlayers(country);
    console.log('Generated squad:', JSON.stringify(squad, null, 2));

    const team = new Team({
      country,
      userId: user.id,
      squad,
      rating: calculateTeamRating(squad)
    });

    await team.save();
    console.log(`Team created: ${country} by ${user.username}`);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Team creation error:', err.message, err.stack);
    if (err.code === 11000) {
      console.log('Duplicate key error for country:', country);
      return res.render('error', { title: 'Error', error: `Team for ${country} already exists` });
    }
    res.render('error', { title: 'Error', error: `Error creating team: ${err.message}` });
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
  if (!squad.length) return 0;
  const totalRating = squad.reduce((sum, player) => {
    return sum + (player.ratings[player.natural_position] || 50);
  }, 0);
  return totalRating / squad.length;
}

module.exports = router;