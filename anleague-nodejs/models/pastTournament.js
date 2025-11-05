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

const pastTournamentSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  bracket: {
    quarterfinals: [{
      match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
      team1_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      team2_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
    }],
    semifinals: [{
      match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
      team1_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      team2_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
    }],
    final: [{
      match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
      team1_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      team2_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
    }]
  },
  status: { type: String, enum: ['quarterfinals', 'semifinals', 'final', 'completed'], default: 'completed' }
});

module.exports = mongoose.model('PastTournament', pastTournamentSchema);