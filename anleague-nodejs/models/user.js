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

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  country: { type: String }, // Allow null, but must be string or absent
  role: { 
    type: String, 
    enum: ['representative', 'admin'], 
    required: true 
  }
});


userSchema.pre('save', function(next) {
  if (!this.role) this.role = 'representative';
  next();
});

module.exports = mongoose.model('User', userSchema);