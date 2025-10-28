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
    if (squad.length !== 23) {
      console.error(`Generated squad has ${squad.length} players, expected 23`);
      throw new Error(`Generated squad has ${squad.length} players, expected 23`);
    }
    console.log('Generated squad:', JSON.stringify(squad, null, 2));

    const team = new Team({
      country,
      userId: user.id,
      representative_id: user.id,
      squad,
      manager: `${user.username} Manager`
    });

    console.log('Team document to save:', JSON.stringify(team.toObject(), null, 2));

    await team.validate();
    console.log('Validation passed, saving team...');
    await team.save();
    console.log(`Team created: ${country} by ${user.username} with 23 players`);
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
  const positions = [
    'GK', 'GK', 'GK', // 3 goalkeepers
    'DF', 'DF', 'DF', 'DF', 'DF', 'DF', 'DF', // 7 defenders
    'MD', 'MD', 'MD', 'MD', 'MD', 'MD', 'MD', 'MD', // 8 midfielders
    'AT', 'AT', 'AT', 'AT', 'AT' // 5 attackers
  ];
  if (positions.length !== 23) {
    console.error(`Positions array has ${positions.length} elements, expected 23`);
    throw new Error(`Positions array has ${positions.length} elements, expected 23`);
  }
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
  console.log(`Generated ${players.length} players for ${country}`);
  return players;
}

function calculateTeamRating(squad) {
  if (!squad || squad.length === 0) {
    console.error('Squad is empty or invalid');
    return 0.0;
  }
  const totalRating = squad.reduce((sum, player) => {
    return sum + (player.ratings[player.natural_position] || 50);
  }, 0);
  return Number((totalRating / squad.length).toFixed(2));
}

// Middleware: Only allow rep of this team
const ownsTeam = async (req, res, next) => {
  const team = await Team.findOne({ representative_id: req.user._id });
  if (!team) return res.redirect('/dashboard');
  req.team = team;
  next();
};

router.use(auth, ownsTeam);

// Update Manager
router.post('/update-manager', ownsTeam, async (req, res) => {
  req.team.manager = req.body.manager;
  await req.team.save();
  res.redirect('/dashboard?message=Manager updated');
});

router.post('/add-player', ownsTeam, async (req, res) => {
  const { name, natural_position, gk, df, md, at, is_captain } = req.body;
  if (is_captain) req.team.squad.forEach(p => p.is_captain = false);
  req.team.squad.push({
    name, natural_position,
    ratings: { GK: +gk, DF: +df, MD: +md, AT: +at },
    is_captain: !!is_captain,
    goals: 0
  });
  await req.team.save();
  res.redirect('/dashboard');
});

router.post('/remove-player', ownsTeam, async (req, res) => {
  req.team.squad = req.team.squad.filter(p => p._id.toString() !== req.body.playerId);
  await req.team.save();
  res.redirect('/dashboard');
});

// Remove Player
router.post('/remove-player', async (req, res) => {
  req.team.squad = req.team.squad.filter(p => p._id.toString() !== req.body.playerId);
  await req.team.save();
  res.redirect('/dashboard');
});

module.exports = router;