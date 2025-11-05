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
const router = express.Router();
const Tournament = require('../models/tournament');
const Team = require('../models/team');
const Match = require('../models/match');
const PastTournament = require('../models/pastTournament');

router.post('/start', async (req, res) => {
  try {
    const teams = await Team.find().lean();
    if (teams.length < 8) {
      return res.status(400).json({ error: 'Need at least 8 teams' });
    }

    const shuffled = [...teams].sort(() => 0.5 - Math.random());
    if (shuffled.length < 8) {
      return res.status(400).json({ error: 'Not enough teams to pair for quarterfinals' });
    }

    const quarterfinals = [];
    for (let i = 0; i < 8; i += 2) {
      if (!shuffled[i + 1]) {
        console.error('Insufficient teams at index', i + 1, 'Teams:', shuffled.map(t => t.country));
        return res.status(400).json({ error: 'Insufficient teams to complete quarterfinal pairs' });
      }
      const match = new Match({
        stage: 'quarterfinal',
        team1_id: shuffled[i]._id,
        team2_id: shuffled[i + 1]._id,
        type: 'simulated'
      });
      await match.save();
      quarterfinals.push({ match_id: match._id, team1_id: shuffled[i]._id, team2_id: shuffled[i + 1]._id });
    }

    const tournament = new Tournament({
      teams: shuffled.slice(0, 8).map(t => t._id),
      bracket: { quarterfinals, semifinals: [], final: [] },
      status: 'active'
    });
    await tournament.save();
    res.json({ message: 'Tournament started' });
  } catch (err) {
    console.error('Start tournament error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/simulate', async (req, res) => {
  try {
    const tournament = await Tournament.findOne()
      .populate('bracket.quarterfinals.match_id')
      .populate('bracket.semifinals.match_id')
      .populate('bracket.final.match_id');
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    let matchesToSimulate = [];
    if (tournament.status === 'active' && tournament.bracket.quarterfinals.length > 0) {
      matchesToSimulate = tournament.bracket.quarterfinals.map(qf => qf.match_id);
    } else if (tournament.status === 'semifinals') {
      matchesToSimulate = tournament.bracket.semifinals.map(sf => sf.match_id);
    } else if (tournament.status === 'final') {
      matchesToSimulate = tournament.bracket.final.map(f => f.match_id);
    }

    const pendingMatches = matchesToSimulate.filter(match => match && match.status === 'pending');
    if (pendingMatches.length === 0) {
      return res.status(400).json({ error: 'No pending matches to simulate' });
    }

    for (const match of pendingMatches) {
      match.score.team1 = Math.floor(Math.random() * 3);
      match.score.team2 = Math.floor(Math.random() * 3);
      match.type = 'simulated';
      match.status = 'completed';
      match.commentary = `Match simulated: ${match.score.team1}-${match.score.team2}`;
      await match.save();
    }

    res.json({ message: 'Matches simulated successfully' });
  } catch (err) {
    console.error('Simulate matches error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/play', async (req, res) => {
  try {
    const tournament = await Tournament.findOne()
      .populate('bracket.quarterfinals.match_id')
      .populate('bracket.semifinals.match_id')
      .populate('bracket.final.match_id');
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    let matchesToPlay = [];
    if (tournament.status === 'active' && tournament.bracket.quarterfinals.length > 0) {
      matchesToPlay = tournament.bracket.quarterfinals.map(qf => qf.match_id);
    } else if (tournament.status === 'semifinals') {
      matchesToPlay = tournament.bracket.semifinals.map(sf => sf.match_id);
    } else if (tournament.status === 'final') {
      matchesToPlay = tournament.bracket.final.map(f => f.match_id);
    }

    const pendingMatches = matchesToPlay.filter(match => match && match.status === 'pending');
    if (pendingMatches.length === 0) {
      return res.status(400).json({ error: 'No pending matches to play' });
    }

    for (const match of pendingMatches) {
      match.score.team1 = Math.floor(Math.random() * 3);
      match.score.team2 = Math.floor(Math.random() * 3);
      match.type = 'played';
      match.commentary = `Match played: ${match.score.team1}-${match.score.team2} with simulated commentary`;
      match.status = 'completed';
      await match.save();
    }

    res.json({ message: 'Matches played successfully' });
  } catch (err) {
    console.error('Play matches error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/restart', async (req, res) => {
  try {
    await Tournament.deleteMany({});
    await Match.deleteMany({});
    res.json({ message: 'Tournament reset' });
  } catch (err) {
    console.error('Reset tournament error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/bracket', async (req, res) => {
  try {
    console.log('Fetching tournament for /bracket');
    const tournament = await Tournament.findOne({ status: { $ne: 'completed' } })
      .sort({ createdAt: -1 })
      .populate('teams', 'country')

    
      .populate({
        path: 'bracket.quarterfinals.match_id',
        populate: [
          { path: 'team1_id', select: 'country' },
          { path: 'team2_id', select: 'country' }
        ]
      })
      .populate({ path: 'bracket.quarterfinals.team1_id', select: 'country' })
      .populate({ path: 'bracket.quarterfinals.team2_id', select: 'country' })

      
      .populate({
        path: 'bracket.semifinals.match_id',
        populate: [
          { path: 'team1_id', select: 'country' },
          { path: 'team2_id', select: 'country' }
        ]
      })
      .populate({ path: 'bracket.semifinals.team1_id', select: 'country' })
      .populate({ path: 'bracket.semifinals.team2_id', select: 'country' })

      
      .populate({
        path: 'bracket.final.match_id',
        populate: [
          { path: 'team1_id', select: 'country' },
          { path: 'team2_id', select: 'country' }
        ]
      })
      .populate({ path: 'bracket.final.team1_id', select: 'country' })
      .populate({ path: 'bracket.final.team2_id', select: 'country' });

    console.log('Populated bracket:', JSON.stringify(tournament?.bracket, null, 2));

    if (req.query.format === 'json') {
      return res.json({ tournament });
    }

    if (!tournament) {
      return res.render('bracket', {
        title: 'Tournament Bracket',
        tournament: null,
        message: 'No active tournament',
        error: null,
        user: req.user
      });
    }

    
    tournament.bracket = tournament.bracket || {};
    tournament.bracket.quarterfinals = (tournament.bracket.quarterfinals || []).filter(m => m.match_id?._id);
    tournament.bracket.semifinals = (tournament.bracket.semifinals || []).filter(m => m.match_id?._id);
    tournament.bracket.final = (tournament.bracket.final || []).filter(m => m.match_id?._id);

    res.render('bracket', {
      title: 'Tournament Bracket',
      tournament,
      message: null,
      error: null,
      user: req.user
    });
  } catch (err) {
    console.error('Bracket route error:', err.message, err.stack);
    res.status(500).render('error', { title: 'Error', error: 'Internal Server Error' });
  }
});


router.get('/rankings', async (req, res) => {
  try {
    
    const matches = await Match.find({ type: { $in: ['simulated', 'played'] } })
      .populate('team1_id', 'country')
      .populate('team2_id', 'country')
      .lean();

    const goalScorers = {};
    matches.forEach(match => {
      if (!Array.isArray(match.goal_scorers)) return;
      match.goal_scorers.forEach(goal => {
        const player = goal.player_name;
        const team = goal.team === 'team1'
          ? match.team1_id?.country || 'Unknown'
          : match.team2_id?.country || 'Unknown';
        if (!goalScorers[player]) {
          goalScorers[player] = { name: player, team, goals: 0 };
        }
        goalScorers[player].goals++;
      });
    });

    const rankings = Object.values(goalScorers)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 20);

   
    const pastTournaments = await PastTournament.find()
      .sort({ year: -1 })
      .lean();

    const pastWithMatches = await Promise.all(
      pastTournaments.map(async (pt) => {
       
        const matchIds = [];
        ['quarterfinals', 'semifinals', 'final'].forEach(stage => {
          pt.bracket[stage]?.forEach(fixture => {
            if (fixture.match_id) matchIds.push(fixture.match_id);
          });
        });

        
        const matches = await Match.find({ _id: { $in: matchIds } })
          .populate('team1_id', 'country')
          .populate('team2_id', 'country')
          .lean();

        const finalMatch = matches.find(m => m.stage === 'final');
        const winner = finalMatch
          ? (finalMatch.score.team1 > finalMatch.score.team2
              ? finalMatch.team1_id?.country
              : finalMatch.team2_id?.country)
          : 'N/A';
        const runnerUp = finalMatch
          ? (finalMatch.score.team1 > finalMatch.score.team2
              ? finalMatch.team2_id?.country
              : finalMatch.team1_id?.country)
          : 'N/A';
        const score = finalMatch
          ? `${finalMatch.score.team1}-${finalMatch.score.team2}`
          : 'N/A';

        return {
          ...pt,
          matches,
          winner,
          runnerUp,
          score
        };
      })
    );

    if (req.query.format === 'json') {
      return res.json({ rankings, pastTournaments: pastWithMatches });
    }

    res.render('rankings', {
      title: 'Goal Scorers & Past Tournaments',
      rankings,
      pastTournaments: pastWithMatches,
      user: req.user
    });
  } catch (err) {
    console.error('Rankings error:', err);
    res.status(500).render('error', { error: 'Failed to load rankings' });
  }
});


router.get('/match/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('team1_id', 'country')
      .populate('team2_id', 'country')
      .select('stage score status commentary goal_scorers type');

    if (!match) {
      return res.status(404).render('error', {
        title: 'Not Found',
        error: 'Match not found'
      });
    }

    res.render('match', {
      title: `${match.team1_id?.country || 'Team 1'} vs ${match.team2_id?.country || 'Team 2'}`,
      match,
      user: req.user
    });
  } catch (err) {
    console.error('Match route error:', err);
    res.status(500).render('error', { title: 'Error', error: 'Failed to load match' });
  }
});

module.exports = router;