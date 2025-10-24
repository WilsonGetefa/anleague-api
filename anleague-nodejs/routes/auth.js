const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/user');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Signup route
router.post('/signup', async (req, res) => {
  const { username, password, email, country, role } = req.body;
  try {
    console.log('Signup attempt:', { username, email, country, role });
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

    // Send confirmation email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to African Nations League',
      text: `Hello ${username},\n\nYour account has been created successfully!\n\nLogin at: https://anleague-api.onrender.com/login`
    });

    res.redirect('/login');
  } catch (err) {
    console.error('Signup error:', err.message);
    res.render('signup', { title: 'Sign Up', error: `Error: ${err.message}` });
  }
});

// Login route
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
    const token = jwt.sign(
      { id: user._id, role: user.role, country: user.country, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 3600000 });
    console.log(`Login successful: ${username}`);
    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/dashboard');
    }
  } catch (err) {
    console.error('Login error:', err.message);
    res.render('login', { title: 'Login', error: `Error: ${err.message}` });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  console.log('User logged out');
  res.redirect('/login');
});

module.exports = router;