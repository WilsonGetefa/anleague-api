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

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  natural_position: { type: String, enum: ['GK', 'DF', 'MD', 'AT'], required: true },
  ratings: {
    GK: { type: Number, default: 50 },
    DF: { type: Number, default: 50 },
    MD: { type: Number, default: 50 },
    AT: { type: Number, default: 50 }
  },
  is_captain: { type: Boolean, default: false },
  goals: { type: Number, default: 0 }
}, { _id: false, timestamps: false }); 

const teamSchema = new mongoose.Schema({
  country: { type: String, required: true, unique: true },
  manager: { type: String, required: true },
  representative_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  squad: {
    type: [playerSchema],
    validate: [v => v.length === 23, 'Squad must have exactly 23 players'],
    required: true
  },
  captain_name: { type: String, required: true },
  rating: { type: Number, required: true },
  players: { type: Array, default: [] }
});


teamSchema.pre('save', function (next) {
  if (!this.squad || this.squad.length !== 23) {
    return next(new Error('Squad must have exactly 23 players'));
  }

  
  const total = this.squad.reduce((sum, player) => {
    const pos = player.natural_position;
    return sum + (player.ratings[pos] || 50);
  }, 0);
  this.rating = Number((total / 23).toFixed(2));

 
  const captain = this.squad.find(p => p.is_captain);
  this.captain_name = captain ? captain.name : this.squad[0]?.name || 'Unknown';

  next();
});

module.exports = mongoose.model('Team', teamSchema);