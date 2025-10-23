const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

router.post('/signup', async (req, res) => {
  const { username, password, email, country, role } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.render('signup', { title: 'Sign Up', error: 'Username or email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
      email,
      country,
      role: role || 'representative'
    });
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role, country: user.country }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect('/login'); // Redirect to login after signup
  } catch (err) {
    res.render('signup', { title: 'Sign Up', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.render('login', { title: 'Login', error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', { title: 'Login', error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, role: user.role, country: user.country }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect('/'); // Redirect to home or dashboard after login
  } catch (err) {
    res.render('login', { title: 'Login', error: err.message });
  }
});

module.exports = router;