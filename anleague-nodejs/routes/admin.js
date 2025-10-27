const express = require('express');
const router = express.Router();
const Tournament = require('../models/tournament');
const Team = require('../models/team');
const Match = require('../models/match');
const PastTournament = require('../models/pastTournament'); // New model for archiving

router.post('/start', async (req, res) => {
  try {
    const teams = await Team.find().lean();
    if (teams.length < 8) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        error: 'Need at least 8 teams',
        message: null,
        tournament: null
      });
    }

    const shuffled = [...teams].sort(() => 0.5 - Math.random());
    const validTeams = shuffled.slice(0, 8).filter(team => team._id && team._id.toString().length === 24);
    if (validTeams.length < 8) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        error: 'Not enough valid teams to pair for quarterfinals',
        message: null,
        tournament: null
      });
    }

    const quarterfinals = [];
    for (let i = 0; i < 8; i += 2) {
      const team1 = validTeams[i];
      const team2 = validTeams[i + 1];
      if (!team1._id || !team2._id) {
        console.error('Invalid team IDs at index', i, 'or', i + 1, 'Teams:', validTeams.map(t => t.country));
        return res.render('admin_dashboard', {
          title: 'Admin Dashboard',
          username: req.user.username,
          error: 'Invalid team data detected',
          message: null,
          tournament: null
        });
      }
      const match = new Match({
        stage: 'quarterfinal',
        team1_id: team1._id,
        team2_id: team2._id,
        type: 'simulated',
        status: 'pending',
        score: { team1: 0, team2: 0 },
        goal_scorers: [],
        commentary: ''
      });
      await match.save();
      quarterfinals.push({ match_id: match._id, team1_id: team1._id, team2_id: team2._id });
    }

    const tournament = new Tournament({
      teams: validTeams.map(t => t._id),
      bracket: { quarterfinals, semifinals: [], final: [] },
      status: 'quarterfinals'
    });
    await tournament.save();
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role, // Add role here
      message: 'Tournament started successfully',
      error: null,
      tournament
    });
  } catch (err) {
    console.error('Start tournament error:', err.message);
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role, // Add role here
      error: 'Failed to start tournament',
      message: null,
      tournament: null
    });
  }
});

router.post('/simulate', async (req, res) => {
  try {
    const tournament = await Tournament.findOne().populate('bracket.quarterfinals.match_id').populate('bracket.semifinals.match_id').populate('bracket.final.match_id');
    if (!tournament) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        error: 'Tournament not found',
        message: null,
        tournament: null
      });
    }

    let matchesToSimulate = [];
    if (tournament.status === 'quarterfinals') {
      matchesToSimulate = tournament.bracket.quarterfinals.map(qf => qf.match_id);
    } else if (tournament.status === 'semifinals') {
      matchesToSimulate = tournament.bracket.semifinals.map(sf => sf.match_id);
    } else if (tournament.status === 'final') {
      matchesToSimulate = tournament.bracket.final.map(f => f.match_id);
    }

    const pendingMatches = matchesToSimulate.filter(match => match.status === 'pending');
    if (pendingMatches.length === 0) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        error: 'No pending matches to simulate',
        message: null,
        tournament
      });
    }

    for (const match of pendingMatches) {
      match.score.team1 = Math.floor(Math.random() * 3);
      match.score.team2 = Math.floor(Math.random() * 3);
      match.type = 'simulated';
      match.status = 'completed';
      match.commentary = `Match simulated: ${match.score.team1}-${match.score.team2}`;
      await match.save();
    }

    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      message: 'Matches simulated successfully',
      error: null,
      tournament
    });
  } catch (err) {
    console.error('Simulate matches error:', err.message);
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      error: 'Failed to simulate matches',
      message: null,
      tournament: null
    });
  }
});

router.post('/play', async (req, res) => {
  try {
    const tournament = await Tournament.findOne().populate('bracket.quarterfinals.match_id').populate('bracket.semifinals.match_id').populate('bracket.final.match_id');
    if (!tournament) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        error: 'Tournament not found',
        message: null,
        tournament: null
      });
    }

    let matchesToPlay = [];
    if (tournament.status === 'quarterfinals') {
      matchesToPlay = tournament.bracket.quarterfinals.map(qf => qf.match_id);
    } else if (tournament.status === 'semifinals') {
      matchesToPlay = tournament.bracket.semifinals.map(sf => sf.match_id);
    } else if (tournament.status === 'final') {
      matchesToPlay = tournament.bracket.final.map(f => f.match_id);
    }

    const pendingMatches = matchesToPlay.filter(match => match.status === 'pending');
    if (pendingMatches.length === 0) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        error: 'No pending matches to play',
        message: null,
        tournament
      });
    }

    for (const match of pendingMatches) {
      match.score.team1 = Math.floor(Math.random() * 3);
      match.score.team2 = Math.floor(Math.random() * 3);
      match.type = 'played';
      match.commentary = `Match played: ${match.score.team1}-${match.score.team2} with simulated commentary`;
      match.status = 'completed';
      await match.save();
    }

    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      message: 'Matches played successfully',
      error: null,
      tournament
    });
  } catch (err) {
    console.error('Play matches error:', err.message);
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      error: 'Failed to play matches',
      message: null,
      tournament: null
    });
  }
});

router.post('/advance', async (req, res) => {
  try {
    const tournament = await Tournament.findOne().populate('bracket.quarterfinals.match_id').populate('bracket.semifinals.match_id').populate('bracket.final.match_id');
    if (!tournament) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        error: 'Tournament not found',
        message: null,
        tournament: null
      });
    }

    if (tournament.status === 'quarterfinals') {
      const allQuarterfinalsCompleted = tournament.bracket.quarterfinals.every(qf => {
        const match = qf.match_id;
        return match && match.status === 'completed';
      });
      if (!allQuarterfinalsCompleted) {
        return res.render('admin_dashboard', {
          title: 'Admin Dashboard',
          username: req.user.username,
          error: 'All quarterfinal matches must be completed',
          message: null,
          tournament
        });
      }

      const semifinalMatches = [];
      for (let i = 0; i < tournament.bracket.quarterfinals.length; i += 2) {
        const match1 = tournament.bracket.quarterfinals[i].match_id;
        const match2 = tournament.bracket.quarterfinals[i + 1].match_id;
        let winner1 = match1.score.team1 > match1.score.team2 ? tournament.bracket.quarterfinals[i].team1_id : tournament.bracket.quarterfinals[i].team2_id;
        let winner2 = match2.score.team1 > match2.score.team2 ? tournament.bracket.quarterfinals[i + 1].team1_id : tournament.bracket.quarterfinals[i + 1].team2_id;

        if (match1.score.team1 === match1.score.team2) {
          const extraTimeGoal = Math.random() < 0.5 ? 1 : 0;
          if (extraTimeGoal === 1) {
            winner1 = Math.random() < 0.5 ? tournament.bracket.quarterfinals[i].team1_id : tournament.bracket.quarterfinals[i].team2_id;
            match1.commentary += `; Extra time goal decided winner: ${winner1}`;
          } else {
            const penaltyWin = Math.random() < 0.5;
            winner1 = penaltyWin ? tournament.bracket.quarterfinals[i].team1_id : tournament.bracket.quarterfinals[i].team2_id;
            match1.commentary += `; Penalty shootout won by: ${winner1}`;
          }
          await match1.save();
        }
        if (match2.score.team1 === match2.score.team2) {
          const extraTimeGoal = Math.random() < 0.5 ? 1 : 0;
          if (extraTimeGoal === 1) {
            winner2 = Math.random() < 0.5 ? tournament.bracket.quarterfinals[i + 1].team1_id : tournament.bracket.quarterfinals[i + 1].team2_id;
            match2.commentary += `; Extra time goal decided winner: ${winner2}`;
          } else {
            const penaltyWin = Math.random() < 0.5;
            winner2 = penaltyWin ? tournament.bracket.quarterfinals[i + 1].team1_id : tournament.bracket.quarterfinals[i + 1].team2_id;
            match2.commentary += `; Penalty shootout won by: ${winner2}`;
          }
          await match2.save();
        }

        const match = new Match({
          stage: 'semifinal',
          team1_id: winner1,
          team2_id: winner2,
          type: 'simulated',
          status: 'pending',
          score: { team1: 0, team2: 0 },
          goal_scorers: [],
          commentary: ''
        });
        await match.save();
        semifinalMatches.push({ match_id: match._id, team1_id: winner1, team2_id: winner2 });
      }
      tournament.bracket.semifinals = semifinalMatches;
      tournament.status = 'semifinals';
      await tournament.save();
      res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        message: 'Semifinals set up successfully',
        error: null,
        tournament
      });
    } else if (tournament.status === 'semifinals') {
      const allSemifinalsCompleted = tournament.bracket.semifinals.every(sf => {
        const match = sf.match_id;
        return match && match.status === 'completed';
      });
      if (!allSemifinalsCompleted) {
        return res.render('admin_dashboard', {
          title: 'Admin Dashboard',
          username: req.user.username,
          error: 'All semifinal matches must be completed',
          message: null,
          tournament
        });
      }

      const finalMatches = [];
      for (let i = 0; i < tournament.bracket.semifinals.length; i += 2) {
        const match1 = tournament.bracket.semifinals[i].match_id;
        const match2 = tournament.bracket.semifinals[i + 1].match_id;
        let winner1 = match1.score.team1 > match1.score.team2 ? tournament.bracket.semifinals[i].team1_id : tournament.bracket.semifinals[i].team2_id;
        let winner2 = match2.score.team1 > match2.score.team2 ? tournament.bracket.semifinals[i + 1].team1_id : tournament.bracket.semifinals[i + 1].team2_id;

        if (match1.score.team1 === match1.score.team2) {
          const extraTimeGoal = Math.random() < 0.5 ? 1 : 0;
          if (extraTimeGoal === 1) {
            winner1 = Math.random() < 0.5 ? tournament.bracket.semifinals[i].team1_id : tournament.bracket.semifinals[i].team2_id;
            match1.commentary += `; Extra time goal decided winner: ${winner1}`;
          } else {
            const penaltyWin = Math.random() < 0.5;
            winner1 = penaltyWin ? tournament.bracket.semifinals[i].team1_id : tournament.bracket.semifinals[i].team2_id;
            match1.commentary += `; Penalty shootout won by: ${winner1}`;
          }
          await match1.save();
        }
        if (match2.score.team1 === match2.score.team2) {
          const extraTimeGoal = Math.random() < 0.5 ? 1 : 0;
          if (extraTimeGoal === 1) {
            winner2 = Math.random() < 0.5 ? tournament.bracket.semifinals[i + 1].team1_id : tournament.bracket.semifinals[i + 1].team2_id;
            match2.commentary += `; Extra time goal decided winner: ${winner2}`;
          } else {
            const penaltyWin = Math.random() < 0.5;
            winner2 = penaltyWin ? tournament.bracket.semifinals[i + 1].team1_id : tournament.bracket.semifinals[i + 1].team2_id;
            match2.commentary += `; Penalty shootout won by: ${winner2}`;
          }
          await match2.save();
        }

        const match = new Match({
          stage: 'final',
          team1_id: winner1,
          team2_id: winner2,
          type: 'simulated',
          status: 'pending',
          score: { team1: 0, team2: 0 },
          goal_scorers: [],
          commentary: ''
        });
        await match.save();
        finalMatches.push({ match_id: match._id, team1_id: winner1, team2_id: winner2 });
      }
      tournament.bracket.final = finalMatches;
      tournament.status = 'final';
      await tournament.save();
      res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        message: 'Final set up successfully',
        error: null,
        tournament
      });
    } else if (tournament.status === 'final') {
      const finalMatch = tournament.bracket.final[0].match_id;
      if (finalMatch && finalMatch.status !== 'completed') {
        return res.render('admin_dashboard', {
          title: 'Admin Dashboard',
          username: req.user.username,
          error: 'Final match must be completed',
          message: null,
          tournament
        });
      }
      tournament.status = 'completed';
      await tournament.save();
      res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        message: 'Tournament completed successfully',
        error: null,
        tournament
      });
    }

    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      error: 'No further stages to advance',
      message: null,
      tournament
    });
  } catch (err) {
    console.error('Advance stage error:', err.message);
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      error: 'Failed to advance stage',
      message: null,
      tournament: null
    });
  }
});

router.post('/restart', async (req, res) => {
  try {
    const tournament = await Tournament.findOne().populate('bracket.quarterfinals.match_id').populate('bracket.semifinals.match_id').populate('bracket.final.match_id');
    if (tournament) {
      // Archive the old tournament
      const pastTournament = new PastTournament({
        ...tournament.toObject(),
        year: new Date().getFullYear() // Use current year as a placeholder
      });
      await pastTournament.save();
      await Tournament.deleteMany({});
      await Match.deleteMany({});
    }
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      message: 'Tournament reset and archived successfully',
      error: null,
      tournament: null
    });
  } catch (err) {
    console.error('Restart tournament error:', err.message);
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      error: 'Failed to reset tournament',
      message: null,
      tournament: null
    });
  }
});

// Append to routes/admin.js
router.post('/edit-match', async (req, res) => {
  try {
    const { matchId, team1Score, team2Score } = req.body;
    const match = await Match.findById(matchId);
    if (!match) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        error: 'Match not found',
        message: null,
        tournament: await Tournament.findOne()
      });
    }

    match.score.team1 = parseInt(team1Score);
    match.score.team2 = parseInt(team2Score);
    match.status = 'completed';
    match.commentary = `Score updated manually: ${team1Score}-${team2Score}`;
    await match.save();

    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      message: 'Match score updated successfully',
      error: null,
      tournament: await Tournament.findOne().populate('bracket.quarterfinals.match_id').populate('bracket.semifinals.match_id').populate('bracket.final.match_id')
    });
  } catch (err) {
    console.error('Edit match error:', err.message);
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      error: 'Failed to update match score',
      message: null,
      tournament: null
    });
  }
});

module.exports = router;