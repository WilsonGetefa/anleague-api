// anleague_app.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const Team = require('./models/team');
const { authMiddleware } = require('./middleware/auth');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// JWT middleware to set req.user
app.use((req, res, next) => {
  if (
    req.path.startsWith('/public') ||
    req.path.includes('images') ||
    req.path === '/favicon.ico' ||
    req.path === '/login' ||
    req.path === '/signup'
  ) {
    console.log('Skipping JWT verification for path:', req.path);
    req.user = null;
    return next();
  }
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      console.log('JWT verified:', req.user.username, 'for path:', req.path, 'user.id:', req.user.id);
    } catch (err) {
      console.error('JWT verification error:', err.message, 'for path:', req.path);
      req.user = null;
    }
  } else {
    console.log('No token provided for path:', req.path, 'Cookies:', req.cookies);
    req.user = null;
  }
  next();
});

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.render('error', { title: 'Error', error: 'Admin access required' });
  }
  next();
};

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/teams', require('./routes/teams'));
app.use('/admin', authMiddleware, adminMiddleware, require('./routes/admin')); // Corrected line
app.use('/', require('./routes/public')); // Already includes rankings, bracket, match
app.use('/', require('./routes/index')); // New index route

// Home route (redirect to index.js handling)
app.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.render('index', { title: 'African Nations League', user: req.user });
});

// Login route
app.get('/login', (req, res) => {
  if (req.user) {
    return res.redirect(req.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
  }
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.render('login', { title: 'Login', error: null });
});

// Signup route
app.get('/signup', (req, res) => {
  if (req.user) {
    return res.redirect(req.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
  }
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.render('signup', { title: 'Sign Up', error: null });
});

// Dashboard route


// Admin dashboard route
app.get('/admin/dashboard', authMiddleware, adminMiddleware, (req, res) => {
  const { username } = req.user;
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.render('admin_dashboard', {
    title: 'Admin Dashboard',
    username: username,
    role: 'admin',
    message: null,
    error: null,
    tournament: null, // Will be populated by admin routes if started
    user: req.user
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { dbName: 'anleague' })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));