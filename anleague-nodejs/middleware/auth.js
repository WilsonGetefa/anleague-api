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

const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    console.log('No token, redirecting to /login');
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log('User not found for token');
      return res.redirect('/login');
    }

    req.user = user;  // ← SET req.user
    console.log('Authentication successful for path:', req.path, 'User:', user.username);
    next();

  } catch (err) {
    console.error('JWT verification failed:', err.message);
    res.redirect('/login');
  }
};

module.exports = { authMiddleware };