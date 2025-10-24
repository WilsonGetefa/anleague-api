const express = require('express');
const router = express.Router();
const Team = require('../models/team');

// Autofill team for the user's country
router.post('/autofill', async (req, res) => {
  const { country } = req.body;
  const { user } = req; // From authMiddleware
  try {
    console.log('Team autofill attempt:', { user: user.username, country });
    if (user.country !== country) {
      return res.status(403).json({ error: 'Can only create team for your country' });
    }
    const existingTeam = await Team.findOne({ country });
    if (existingTeam) {
      return res.status(400).json({ error: `Team for ${country} already exists` });
    }
    const team = new Team({
      country,
      userId: user.id,
      squad: generateDefaultPlayers(country),
    });
    await team.save();
    console.log(`Team created: ${country} by ${user.username}`);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Team creation error:', err.message);
    res.status(500).json({ error: `Error: ${err.message}` });
  }
});

// Helper function to generate default players
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
    is_captain: index === 0, // First player is captain
    goals: 0
  }));
  return players;
}

module.exports = router;