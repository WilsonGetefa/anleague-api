const express = require('express');
const router = express.Router();
const Team = require('../models/team');
const User = require('../models/user');
const auth = require('../middleware/auth').authMiddleware;
const { ownsTeam } = require('../middleware/ownsTeam');

// ————————————————————————————————————————————————
// PUBLIC: Autofill team (protected by login)
// ————————————————————————————————————————————————
router.post('/autofill', auth, async (req, res) => {
  const { country } = req.body;
  const user = req.user;

  try {
    if (!user) return res.redirect('/login');
    if (!country || user.country !== country) {
      return res.redirect('/dashboard?error=Invalid country');
    }

    const existingTeam = await Team.findOne({ country });
    if (existingTeam) {
      return res.redirect('/dashboard?error=Team already exists');
    }

    const squad = generateDefaultPlayers(country);
    if (squad.length !== 23) {
      throw new Error(`Generated ${squad.length} players, expected 23`);
    }

    const team = new Team({
      country,
      representative_id: user._id,
      squad,
      manager: `${user.username}'s Manager`
    });

    await team.save(); // pre-save hook sets rating & captain_name
    console.log(`Team created: ${country} | Rating: ${team.rating} | Captain: ${team.captain_name}`);

    // RE-FETCH TEAM + RENDER DASHBOARD
    const freshTeam = await Team.findOne({ representative_id: user._id });
    res.render('dashboard', {
      title: 'Dashboard',
      user,
      team: freshTeam,
      message: 'Team created successfully!',
      error: null
    });

  } catch (err) {
    console.error('Autofill error:', err);
    const team = await Team.findOne({ country }).catch(() => null);
    res.render('dashboard', {
      title: 'Dashboard',
      user,
      team,
      message: null,
      error: err.message || 'Failed to create team'
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

router.use(auth, ownsTeam);

// Update Manager
router.post('/update-manager', async (req, res) => {
  req.team.manager = req.body.manager?.trim() || 'Unnamed Manager';
  await req.team.save();
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

  await req.team.save();
  res.redirect('/dashboard');
});

// EDIT
router.post('/teams/edit-player-name', authMiddleware, ownsTeam, async (req, res) => {
  const { playerId, newName } = req.body;
  if (!playerId || !newName?.trim()) {
    return res.redirect('/error?error=' + encodeURIComponent('Name required'));
  }
  const player = req.team.squad.id(playerId);
  if (!player) return res.redirect('/error?error=' + encodeURIComponent('Player not found'));
  player.name = newName.trim();
  await req.team.save();
  res.redirect('/dashboard?message=Name updated');
});

// REMOVE
router.post('/teams/remove-player', authMiddleware, ownsTeam, async (req, res) => {
  const { playerId } = req.body;
  if (!playerId) return res.redirect('/error?error=' + encodeURIComponent('No player selected'));
  req.team.squad = req.team.squad.filter(p => p._id.toString() !== playerId);
  await req.team.save();
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

module.exports = router;