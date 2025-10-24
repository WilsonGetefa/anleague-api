const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

router.post('/signup', async (req, res) => {
  const { username, password, email, country, role } = req.body;
  try {
    // Log request data for debugging
    console.log('Signup attempt:', { username, email, country, role });

    // Check for existing username or email
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      console.log(`Signup failed: Username '${username}' already exists`);
      return res.render('signup', { title: 'Sign Up', error: 'Username already exists' });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      console.log(`Signup failed: Email '${email}' already exists`);
      return res.render('signup', { title: 'Sign Up', error: 'Email already exists' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
      email,
      country,
      role: role || 'representative'
    });
    await user.save();
    console.log(`User created successfully: ${username}, Email: ${email}, Country: ${country}, Role: ${role}`);

    // Redirect to login on success
    res.redirect('/login');
  } catch (err) {
    console.error('Signup error:', err.message);
    res.render('signup', { title: 'Sign Up', error: `Error: ${err.message}` });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    console.log('Login attempt:', { username });
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`Login failed: Username '${username}' not found`);
      return res.render('login', { title: 'Login', error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Login failed: Incorrect password for '${username}'`);
      return res.render('login', { title: 'Login', error: 'Invalid credentials' });
    }
    if (isMatch) {
    const token = jwt.sign({ id: user._id, role: user.role, country: user.country, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect('/dashboard'); // Changed from '/'
    }
    const token = jwt.sign({ id: user._id, role: user.role, country: user.country }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(`Login successful: ${username}`);
    res.redirect('/'); // Lands on home page
  } catch (err) {
    console.error('Login error:', err.message);
    res.render('login', { title: 'Login', error: `Error: ${err.message}` });
  }
});

module.exports = router;