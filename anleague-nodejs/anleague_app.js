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
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const Team = require('./models/team');
const { authMiddleware } = require('./middleware/auth');
const errorRoutes = require('./routes/error');


dotenv.config();


const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


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


const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.render('error', { title: 'Error', error: 'Admin access required' });
  }
  next();
};


app.use('/auth', require('./routes/auth'));
app.use('/teams', require('./routes/teams'));
app.use('/admin', authMiddleware, adminMiddleware, require('./routes/admin')); // Corrected line
app.use('/', require('./routes/public')); // Already includes rankings, bracket, match
app.use('/', require('./routes/index')); 
app.use('/', errorRoutes);


app.get('/signup', (req, res) => res.redirect('/auth/signup'));
app.get('/login', (req, res) => res.redirect('/auth/login'));


app.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.render('index', { title: 'African Nations League', user: req.user });
});


app.get('/admin/dashboard', authMiddleware, adminMiddleware, (req, res) => {
  const { username } = req.user;
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.render('admin_dashboard', {
    title: 'Admin Dashboard',
    username: username,
    role: 'admin',
    message: null,
    error: null,
    tournament: null,
    user: req.user
  });
});


app.use((req, res, next) => {
  const err = new Error('Page not found');
  err.status = 404;
  next(err); 
});


app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);


  const user = req.user || req.session?.user || null;

  
  const status = err.status || 500;
  const message = status === 404 ? 'Page not found' : '"Server error". Please try again.';

  
  res.status(status).render('error', {
    title: 'Error',
    error: message,
    user: user  
  });
});

console.log('Team routes mounted: /update-manager → /teams/update-manager');


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


mongoose.connect(process.env.MONGO_URI, { dbName: 'anleague' })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
