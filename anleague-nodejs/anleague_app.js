const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const Team = require('./models/team');

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
  if (req.path.startsWith('/public') || req.path.includes('images') || req.path === '/favicon.ico') {
    return next(); // Skip JWT for static files
  }
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      console.log('JWT verified:', req.user.username, 'for path:', req.path);
    } catch (err) {
      console.error('JWT verification error:', err.message, 'for path:', req.path);
      req.user = null;
    }
  } else {
    console.log('No token provided for path:', req.path);
    req.user = null;
  }
  next();
});

// Authentication middleware for protected routes
const authMiddleware = (req, res, next) => {
  if (!req.user) {
    console.log('Authentication failed for path:', req.path);
    return res.redirect('/login');
  }
  next();
};

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.render('error', { title: 'Error', error: 'Admin access required' });
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
  res.render('index', { title: 'African Nations League', user: req.user });
});

// Login route
app.get('/login', (req, res) => {
  if (req.user) {
    return res.redirect(req.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
  }
  res.render('login', { title: 'Login', error: null });
});

// Signup route
app.get('/signup', (req, res) => {
  if (req.user) {
    return res.redirect(req.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
  }
  res.render('signup', { title: 'Sign Up', error: null });
});

// Dashboard route
app.get('/dashboard', authMiddleware, async (req, res) => {
  const { username, country, role } = req.user;
  try {
    const hasTeam = await Team.findOne({ country });
    res.render('dashboard', {
      title: 'Dashboard',
      username,
      country,
      role,
      error: null,
      hasTeam: !!hasTeam
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.render('dashboard', {
      title: 'Dashboard',
      username,
      country,
      role,
      error: 'Error checking team status',
      hasTeam: false
    });
  }
});

// Admin dashboard route
app.get('/admin/dashboard', authMiddleware, adminMiddleware, (req, res) => {
  const { username } = req.user;
  res.render('admin_dashboard', { title: 'Admin Dashboard', username, role: 'admin' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { dbName: 'anleague' })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));