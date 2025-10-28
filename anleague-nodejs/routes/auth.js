const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Full CAF Nations (you can expand)
const CAF_COUNTRIES = [
  'Algeria', 'Angola', 'Cameroon', 'Côte d\'Ivoire', 'DR Congo', 'Egypt',
  'Ghana', 'Guinea', 'Mali', 'Morocco', 'Nigeria', 'Senegal', 'South Africa',
  'Tunisia', 'Zambia'
];

// GET /signup — show form with country dropdown
router.get('/signup', (req, res) => {
  res.render('signup', {
    title: 'Sign Up',
    error: null,
    countries: CAF_COUNTRIES
  });
});

// POST /signup — create user + link to team
router.post('/signup', async (req, res) => {
  const { username, email, password, country, role = 'representative' } = req.body;

  // Validate country
  if (!CAF_COUNTRIES.includes(country)) {
    return res.render('signup', {
      title: 'Sign Up',
      error: 'Invalid country selected',
      countries: CAF_COUNTRIES
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.render('signup', {
        title: 'Sign Up',
        error: 'Username or email already taken',
        countries: CAF_COUNTRIES
      });
    }

    // Check if country already has a rep
    const existingRep = await Team.findOne({ country, representative_id: { $ne: null } });
    if (existingRep) {
      return res.render('signup', {
        title: 'Sign Up',
        error: `Team "${country}" already has a representative`,
        countries: CAF_COUNTRIES
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      country,
      role
    });

    // Find or create team
    let team = await Team.findOne({ country });
    if (!team) {
      team = await Team.create({
        country,
        manager: '',
        representative_id: user._id,
        squad: []
      });
    } else {
      team.representative_id = user._id;
      await team.save();
    }

    // Auto-login
    req.login(user, (err) => {
      if (err) {
        console.error('Auto-login failed:', err);
        return res.redirect('/login');
      }
      res.redirect('/dashboard');
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.render('signup', {
      title: 'Sign Up',
      error: 'Failed to create account',
      countries: CAF_COUNTRIES
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { title: 'Login', error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, username, country: user.country, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    console.log('Login successful, token set for user:', username);
    res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
  } catch (err) {
    console.error('Login error:', err.message);
    res.render('login', { title: 'Login', error: 'Error logging in' });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  console.log('Logout route accessed, clearing token');
  res.clearCookie('token', { httpOnly: true, path: '/', secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
  console.log('Token cookie cleared, redirecting to /login');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.redirect('/login');
});

module.exports = router;