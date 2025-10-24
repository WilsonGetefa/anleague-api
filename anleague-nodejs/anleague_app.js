const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Add for cookie handling
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// JWT middleware for req.user
app.use((req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      console.log('JWT verified:', req.user.username);
    } catch (err) {
      console.error('JWT verification error:', err.message);
      req.user = null; // Ensure req.user is null if token is invalid
    }
  } else {
    console.log('No token provided');
    req.user = null; // No token provided
  }
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { dbName: 'anleague' })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/teams', authMiddleware, require('./routes/teams'));
app.use('/admin', authMiddleware, adminMiddleware, require('./routes/admin'));
app.use('/', require('./routes/public'));

// Home route
app.get('/', (req, res) => {
  res.render('index', { title: 'African Nations League' });
});

// Login route
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login', error: null });
});

// Signup route
app.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up', error: null });
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  if (!req.user) {
    return res.redirect('/login'); // Redirect to login if not authenticated
  }
  const { username, country, role } = req.user;
  res.render('dashboard', { title: 'Dashboard', username, country, role });
});

// Admin dashboard route
app.get('/admin/dashboard', authMiddleware, adminMiddleware, (req, res) => {
  const { username } = req.user;
  res.render('admin_dashboard', { title: 'Admin Dashboard', username, role: 'admin' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));