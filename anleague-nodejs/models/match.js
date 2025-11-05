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

const goalScorerSchema = new mongoose.Schema({
  player_name: { type: String, required: true },
  minute: { type: Number, min: 1, max: 120 },
  team: { type: String, enum: ['team1', 'team2'] }
});

const matchSchema = new mongoose.Schema({
  stage: { type: String, enum: ['quarterfinal', 'semifinal', 'final'], required: true },
  team1_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  team2_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  score: {
    team1: { type: Number, default: 0 },
    team2: { type: Number, default: 0 }
  },
  extra_time_score: {
    team1: { type: Number, default: 0 },
    team2: { type: Number, default: 0 }
  },
  penalty_outcome: {
    team1: { type: Number, default: 0 },
    team2: { type: Number, default: 0 }
  },
  goal_scorers: [goalScorerSchema],
  type: { type: String, enum: ['played', 'simulated'], required: true },
  commentary: { type: String },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  tournament_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true } 
}, { timestamps: true }); 

module.exports = mongoose.model('Match', matchSchema);