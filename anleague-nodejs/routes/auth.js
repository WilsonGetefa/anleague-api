const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Team = require('../models/team');

// ======================
// PLACEHOLDER SQUAD GENERATOR (INLINE)
// ======================
function generatePlaceholderSquad(country) {
  const positions = [
    // 3 Goalkeepers
    { pos: 'GK', rating: 80 },
    { pos: 'GK', rating: 78 },
    { pos: 'GK', rating: 76 },

    // 8 Defenders
    ...Array(8).fill({ pos: 'DF', rating: 78 }),

    // 8 Midfielders
    ...Array(8).fill({ pos: 'MD', rating: 78 }),

    // 4 Attackers
    ...Array(4).fill({ pos: 'AT', rating: 78 }),
  ];

  return positions.map((p, i) => ({
    name: `${country} Player ${i + 1}`,
    natural_position: p.pos,
    ratings: {
      GK: p.pos === 'GK' ? p.rating : 50,
      DF: p.pos === 'DF' ? p.rating : 50,
      MD: p.pos === 'MD' ? p.rating : 50,
      AT: p.pos === 'AT' ? p.rating : 50,
    },
    is_captain: i === 0,  // First player is captain
    goals: 0,
  }));
}

// ======================
// CAF COUNTRIES
// ======================
const CAF_COUNTRIES = [
  'Algeria', 'Angola', 'Cameroon', "Côte d'Ivoire", 'DR Congo', 'Egypt',
  'Ghana', 'Guinea', 'Mali', 'Morocco', 'Nigeria', 'Senegal',
  'South Africa', 'Tunisia', 'Zambia'
];

// ======================
// GET /auth/signup
// ======================
router.get('/signup', (req, res) => {
  res.render('signup', {
    title: 'Sign Up',
    error: null,
    countries: CAF_COUNTRIES,
  });
});

// ======================
// POST /auth/signup
// ======================
router.post('/signup', async (req, res) => {
  const { username, email, password, country, role = 'representative' } = req.body;

  // 1. Validate country
  if (!CAF_COUNTRIES.includes(country)) {
    return res.render('signup', {
      title: 'Sign Up',
      error: 'Invalid country selected',
      countries: CAF_COUNTRIES,
    });
  }

  try {
    // 2. Check if user exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.render('signup', {
        title: 'Sign Up',
        error: 'Username or email already taken',
        countries: CAF_COUNTRIES,
      });
    }

    // 3. Check if country already has a representative
    const existingRep = await Team.findOne({
      country,
      representative_id: { $ne: null },
    });
    if (existingRep) {
      return res.render('signup', {
        title: 'Sign Up',
        error: `Team "${country}" already has a representative`,
        countries: CAF_COUNTRIES,
      });
    }

    // 4. Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      country,
      role,
    });

    // 5. Generate 23-player squad
    const squad = generatePlaceholderSquad(country);
    const captainName = squad[0].name; // First player is captain

    // 6. Create full team (satisfies strict validator)
    await Team.create({
      country,
      manager: `${username} Manager`,     // editable later
      representative_id: user._id,
      squad,
      captain_name: captainName,
      rating: 78,
    });

    // 7. Auto-login with JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, country: user.country, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log('Signup & auto-login successful:', username);
    return res.redirect('/dashboard');

  } catch (err) {
    console.error('Signup error:', err);
    return res.render('signup', {
      title: 'Sign Up',
      error: err.message.includes('validation failed')
        ? 'Team setup failed – contact admin'
        : 'Failed to create account',
      countries: CAF_COUNTRIES,
    });
  }
});

// ======================
// POST /auth/login
// ======================
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { title: 'Login', error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, country: user.country, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log('Login successful:', username);
    res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { title: 'Login', error: 'Login failed' });
  }
});

// ======================
// GET /auth/logout
// ======================
router.get('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.redirect('/login');
});

module.exports = router;