const express = require('express');
const router = express.Router();
const Team = require('../models/team');
const User = require('../models/user');
const auth = require('../middleware/auth').authMiddleware;
const { ownsTeam } = require('../middleware/ownsTeam');
const { authMiddleware } = require('../middleware/auth');  // ← ADD
const Match = require('../models/match'); // ADD THIS LINE AT TOP


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

      // ————————————————————————————————
    // FIX: UPDATE GOALS FROM MATCHES
    // ————————————————————————————————
    // ————————————————————
// FAST & CORRECT GOAL SYNC
// ————————————————————
    // ————————————————————
// FAST & CORRECT GOAL SYNC
// ————————————————————
  const Match = require('../models/match');

  const allPlayerNames = teams.flatMap(t => t.squad.map(p => p.name));

  const goalCounts = await Match.aggregate([
    { $unwind: '$goal_scorers' },
    { $match: { 'goal_scorers.player_name': { $in: allPlayerNames } } },
    { $group: { _id: '$goal_scorers.player_name', goals: { $sum: 1 } } }
  ]);

  const goalMap = Object.fromEntries(goalCounts.map(g => [g._id, g.goals]));

  for (const team of teams) {
    for (const player of team.squad) {
      player.goals = goalMap[player.name] || 0;
    }
  }
    // ————————————————————————————————

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

// Update Manager
router.post('/update-manager', auth, ownsTeam, async (req, res) => {
  const newManagerName = req.body.manager?.trim();
  if (!newManagerName) {
    return res.redirect('/dashboard?error=Manager name required');
  }
  req.team.manager = newManagerName;
  await req.team.save();
  res.redirect('/dashboard?message=Manager updated');
});

// Add Player
router.post('/add-player', authMiddleware, ownsTeam, async (req, res) => {
  const { name, natural_position, gk, df, md, at, is_captain } = req.body;

  if (!name?.trim() || !natural_position) {
    return res.redirect('/dashboard?error=Name and position required');
  }

  // ---- NEW: keep captain flag consistent ----
  if (is_captain) {
    req.team.squad.forEach(p => p.is_captain = false);
  }

  // ---- NEW: assign index (next available) ----
  const nextIndex = req.team.squad.length;   // 0-based

  req.team.squad.push({
    name: name.trim(),
    natural_position,
    index: nextIndex,                         // <-- added
    ratings: { GK: +gk || 50, DF: +df || 50, MD: +md || 50, AT: +at || 50 },
    is_captain: !!is_captain,
    goals: 0
  });

  await req.team.save();
  res.redirect('/dashboard?message=Player added');
});

// EDIT
router.post('/edit-player-name', authMiddleware, ownsTeam, async (req, res) => {
  const { playerIndex, newName } = req.body;   // <-- renamed from playerId

  if (!playerIndex || !newName?.trim()) {
    return res.redirect('/dashboard?error=Name required');
  }

  const idx = Number(playerIndex);
  const player = req.team.squad[idx];

  if (!player) {
    return res.redirect('/dashboard?error=Player not found');
  }

  player.name = newName.trim();
  await req.team.save();

  res.redirect('/dashboard?message=Player name updated');
});

// REMOVE
router.post('/remove-player', authMiddleware, ownsTeam, async (req, res) => {
  const { playerIndex } = req.body;
  if (!playerIndex) return res.redirect('/dashboard?error=No player selected');

  const idx = Number(playerIndex);
  if (idx < 0 || idx >= req.team.squad.length) {
    return res.redirect('/dashboard?error=Invalid player');
  }

  req.team.squad.splice(idx, 1);   // removes exactly that slot
  // Re-index the remaining players so gaps are closed (optional but clean)
  req.team.squad.forEach((p, i) => p.index = i);

  await req.team.save();
  res.redirect('/dashboard?message=Player removed');
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