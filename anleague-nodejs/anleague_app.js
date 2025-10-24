const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

//Add middleware for req.user
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error('JWT verification error:', err.message);
    }
  }
  next();
});

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
//mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
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
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
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

// Adding Login
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login', error: null });
});

//Adding Signup
app.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up', error: null });
});

//Addind Dashboard
app.get('/dashboard', (req, res) => {
  // Assuming JWT middleware sets req.user
  const { username, country, role } = req.user || { username: 'Guest', country: 'N/A', role: 'N/A' };
  res.render('dashboard', { title: 'Dashboard', username, country, role });
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));