const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Signup route
router.post('/signup', async (req, res) => {
  const { username, email, password, country, role } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.render('signup', { title: 'Sign Up', error: 'Username or email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, country, role });
    await user.save();
    res.redirect('/login');
  } catch (err) {
    console.error('Signup error:', err.message);
    res.render('signup', { title: 'Sign Up', error: 'Error creating user' });
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
    const token = jwt.sign({ id: user._id, username, country: user.country, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
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