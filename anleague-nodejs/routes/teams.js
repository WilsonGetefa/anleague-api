const express = require('express');
const router = express.Router();
const Team = require('../models/team');
const User = require('../models/user');
const mongoose = require('mongoose');
const auth = require('../middleware/auth').authMiddleware;

// ————————————————————————————————————————————————
// PUBLIC: Autofill team (protected by login)
// ————————————————————————————————————————————————
router.post('/autofill', auth, async (req, res) => {
  const { country } = req.body;
  const user = req.user;

  try {
    if (!user) return res.redirect('/login');
    if (!country || user.country !== country) {
      return res.render('dashboard', {
        title: 'Dashboard',
        user,
        country: user.country,
        error: 'Can only create team for your country',
        hasTeam: false
      });
    }

    const existingTeam = await Team.findOne({ country });
    if (existingTeam) {
      return res.render('dashboard', {
        title: 'Dashboard',
        user,
        country,
        error: `Team for ${country} already exists`,
        hasTeam: true
      });
    }

    const squad = generateDefaultPlayers(country);
    if (squad.length !== 23) {
      throw new Error(`Generated ${squad.length} players, expected 23`);
    }

    const team = new Team({
      country,
      userId: user._id,
      representative_id: user._id,
      squad,
      manager: `${user.username}'s Manager`,
      players: [], // optional
      captain_name: '' // will be set in pre-save
    });

    await team.save(); // ← pre-save hook calculates rating & captain_name
    console.log(`Team created: ${country} | Rating: ${team.rating} | Captain: ${team.captain_name}`);
    res.redirect('/dashboard');

  } catch (err) {
    console.error('Autofill error:', err);
    const hasTeam = await Team.findOne({ country }).then(t => !!t);
    res.render('dashboard', {
      title: 'Dashboard',
      user,
      country,
      error: err.message || 'Failed to create team',
      hasTeam
    });
  }
});

// ————————————————————————————————————————————————
// PUBLIC: View all teams
// ————————————————————————————————————————————————
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find()
      .select('country manager rating squad captain_name representative_id')
      .populate('representative_id', 'username')
      .sort({ rating: -1 });

    res.render('teams', {
      title: 'Teams',
      teams,
      user: req.user || null,
      error: null
    });
  } catch (err) {
    console.error('Teams fetch error:', err);
    res.render('teams', {
      title: 'Teams',
      teams: [],
      user: req.user || null,
      error: 'Unable to fetch teams'
    });
  }
});

// ————————————————————————————————————————————————
// PROTECTED: Team management (login + owns team)
// ————————————————————————————————————————————————

// Middleware: user must own the team
const ownsTeam = async (req, res, next) => {
  try {
    const team = await Team.findOne({ representative_id: req.user._id });
    if (!team) return res.redirect('/dashboard');
    req.team = team;
    next();
  } catch (err) {
    console.error('ownsTeam error:', err);
    res.redirect('/dashboard');
  }
};

// Apply auth + ownsTeam to all routes below
router.use(auth, ownsTeam);

// Update Manager
router.post('/update-manager', async (req, res) => {
  req.team.manager = req.body.manager?.trim() || 'Unnamed Manager';
  await req.team.save(); // ← rating & captain auto-updated
  res.redirect('/dashboard?message=Manager updated');
});

// Add Player
router.post('/add-player', async (req, res) => {
  const { name, natural_position, gk, df, md, at, is_captain } = req.body;

  if (!name || !natural_position) {
    return res.redirect('/dashboard?error=Missing player data');
  }

  if (is_captain) {
    req.team.squad.forEach(p => p.is_captain = false);
  }

  req.team.squad.push({
    name: name.trim(),
    natural_position,
    ratings: {
      GK: +gk || 50,
      DF: +df || 50,
      MD: +md || 50,
      AT: +at || 50
    },
    is_captain: !!is_captain,
    goals: 0
  });

  await req.team.save(); // ← rating & captain auto-updated
  res.redirect('/dashboard');
});

// Remove Player
router.post('/remove-player', async (req, res) => {
  const { playerId } = req.body;
  if (!playerId) return res.redirect('/dashboard?error=No player selected');

  req.team.squad = req.team.squad.filter(p => p._id.toString() !== playerId);
  await req.team.save(); // ← rating & captain auto-updated
  res.redirect('/dashboard');
});

// ————————————————————————————————————————————————
// UTILS: Generate 23 default players
// ————————————————————————————————————————————————
function generateDefaultPlayers(country) {
  const positions = [
    'GK', 'GK', 'GK',
    'DF', 'DF', 'DF', 'DF', 'DF', 'DF', 'DF',
    'MD', 'MD', 'MD', 'MD', 'MD', 'MD', 'MD', 'MD',
    'AT', 'AT', 'AT', 'AT', 'AT'
  ];

  return positions.map((pos, i) => ({
    name: `${country} Player ${i + 1}`,
    natural_position: pos,
    ratings: {
      GK: pos === 'GK' ? 80 : 50,
      DF: pos === 'DF' ? 80 : 50,
      MD: pos === 'MD' ? 80 : 50,
      AT: pos === 'AT' ? 80 : 50
    },
    is_captain: i === 0,
    goals: 0
  }));
}

// ————————————————————————————————————————————————
// OPTIONAL: Manual rating calculator (not needed)
// ————————————————————————————————————————————————
function calculateTeamRating(squad) {
  if (!squad || squad.length === 0) return 0.0;
  const total = squad.reduce((sum, p) => {
    return sum + (p.ratings[p.natural_position] || 50);
  }, 0);
  return Number((total / squad.length).toFixed(2));
}

module.exports = router;