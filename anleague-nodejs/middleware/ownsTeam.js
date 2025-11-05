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

const Team = require('../models/team');

const ownsTeam = async (req, res, next) => {
  try {
    const team = await Team.findOne({ representative_id: req.user._id });
    if (!team) return res.redirect('/dashboard');
    req.team = team;
    next();
  } catch (err) {
    console.error('ownsTeam error:', err);
    res.redirect('/dashboard');
  }
};

module.exports = { ownsTeam };