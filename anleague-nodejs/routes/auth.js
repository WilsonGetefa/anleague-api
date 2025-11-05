/**
 * African Nations League (ANL) Application
 * ==================================================
 * Welcome to the African Nations League (ANL) — a full-featured, production-ready web application that simulates a realistic African football tournament with 8 national teams, real player names, goal scorers, match commentary, historical archives, and admin controls.
 *
 * Built with: Node.js, Express, MongoDB, EJS
 * Deployment: Render, MongoDB, GitHub, Node.js host
 *
 * Admin Routes:
 *   • GET  /admin/data           → Render data overview
 *   • POST /admin/delete-*       → Secure delete operations
 *   • Excel export via client-side ExcelJS
 *
 * Build by: Wilson Getefa Sisimi
 * Year: 2025
 * Copyright: © 2025 African Nations League. All rights reserved.
 * Info: Official platform powered by WGS - UCT
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Team = require('../models/team');
const auth = require('../middleware/auth').authMiddleware;

function generatePlaceholderSquad(country) {
  const positions =[
    'GK', 'GK', 'GK',
    'DF', 'DF', 'DF', 'DF', 'DF', 'DF', 'DF', 'DF',
    'MD', 'MD', 'MD', 'MD', 'MD', 'MD', 'MD', 'MD',
    'AT', 'AT', 'AT', 'AT',
  ];

  if (positions.length !== 23) throw new Error(`Must have 23 positions, got ${positions.length}`);

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
    goals: 0,
  }));
}


const CAF_COUNTRIES = [
  'Algeria',
  'Angola',
  'Benin',
  'Botswana',
  'Burkina Faso',
  'Burundi',
  'Cameroon',
  'Cape Verde',
  'Central African Republic',
  'Chad',
  'Comoros',
  'Congo',
  'DR Congo',
  'Djibouti',
  'Egypt',
  'Equatorial Guinea',
  'Eritrea',
  'Eswatini',
  'Ethiopia',
  'Gabon',
  'Gambia',
  'Ghana',
  'Guinea',
  'Guinea-Bissau',
  'Côte d\'Ivoire',
  'Kenya',
  'Lesotho',
  'Liberia',
  'Libya',
  'Madagascar',
  'Malawi',
  'Mali',
  'Mauritania',
  'Mauritius',
  'Morocco',
  'Mozambique',
  'Namibia',
  'Niger',
  'Nigeria',
  'Rwanda',
  'São Tomé and Príncipe',
  'Senegal',
  'Seychelles',
  'Sierra Leone',
  'Somalia',
  'South Africa',
  'South Sudan',
  'Sudan',
  'Tanzania',
  'Togo',
  'Tunisia',
  'Uganda',
  'Zambia',
  'Zimbabwe'
];


router.get('/signup', (req, res) => {
  res.render('signup', {
    title: 'Sign Up',
    error: null,
    countries: CAF_COUNTRIES,
  });
});


router.post('/signup', async (req, res) => {
  const { username, email, password, country, role = 'representative' } = req.body;


  if (!['representative', 'admin'].includes(role)) {
    return res.render('signup', {
      title: 'Sign Up',
      error: 'Invalid role selected',
      countries: CAF_COUNTRIES,
    });
  }

  if (role === 'representative' && !CAF_COUNTRIES.includes(country)) {
    return res.render('signup', {
      title: 'Sign Up',
      error: 'Invalid country selected',
      countries: CAF_COUNTRIES,
    });
  }

  try {

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.render('signup', {
        title: 'Sign Up',
        error: 'Username or email already taken',
        countries: CAF_COUNTRIES,
      });
    }

    if (role === 'representative') {
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
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      country: role === 'representative' ? country : undefined,
      role,
    });

    if (role === 'representative') {
      const squad = generatePlaceholderSquad(country);
      const captain = squad.find(p => p.is_captain) || squad[0];
      const totalRating = squad.reduce((sum, p) => sum + (p.ratings[p.natural_position] || 50), 0);
      const calculatedRating = Number((totalRating / 23).toFixed(2));

      const plainSquad = squad.map(p => ({
        name: p.name,
        natural_position: p.natural_position,
        ratings: { 
          GK: Number(p.ratings.GK), 
          DF: Number(p.ratings.DF), 
          MD: Number(p.ratings.MD), 
          AT: Number(p.ratings.AT) 
        },
        is_captain: Boolean(p.is_captain),
        goals: Number(p.goals)
      }));

      await Team.create({
        country,
        representative_id: user._id,
        manager: `${username} Manager`,
        squad: plainSquad,
        captain_name: captain.name,
        rating: calculatedRating,
        players: []
      });
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

    console.log('Signup & auto-login successful:', username, 'Role:', role);

    return res.redirect(role === 'admin' ? '/admin/dashboard' : '/dashboard');

  } catch (err) {
    console.error('Signup error:', err);
    return res.render('signup', {
      title: 'Sign Up',
      error: 'Failed to create account',
      countries: CAF_COUNTRIES,
    });
  }
});

router.get('/login', (req, res) => {
  if (req.user) {
    return res.redirect(req.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
  }
  res.render('login', {
    title: 'Login',
    error: null
  });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { 
        title: 'Login', 
        error: 'Invalid credentials' 
      });
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

router.get('/dashboard', auth, async (req, res) => {
  try {
    console.log('=== DASHBOARD DEBUG ===');
    console.log('req.user:', req.user);
    console.log('req.user._id:', req.user?._id);
    console.log('req.user.id:', req.user?.id);
    console.log('req.user.role:', req.user?.role);

    if (!req.user || req.user.role !== 'representative') {
      return res.redirect('/login');
    }

    const team = await Team.findOne({ representative_id: req.user._id });
    console.log('Team found:', team ? team.country : 'NO TEAM');

    res.render('dashboard', {
      title: 'Dashboard',
      user: req.user,
      team,
      message: req.flash?.('success') || null,
      error: req.flash?.('error') || null
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).render('error', { error: 'Server error' });
  }
});


router.get('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.redirect('/login');
});

module.exports = router;