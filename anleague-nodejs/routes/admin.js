const express = require('express');
const router = express.Router();
const Tournament = require('../models/tournament');
const Team = require('../models/team');
const Match = require('../models/match');
const PastTournament = require('../models/pastTournament'); // For archiving

// Add this at the top with other routes in routes/admin.js
router.get('/dashboard', async (req, res) => {
  try {
    const tournament = await Tournament.findOne()
      .populate('bracket.quarterfinals.match_id')
      .populate('bracket.quarterfinals.team1_id', 'country')
      .populate('bracket.quarterfinals.team2_id', 'country')
      .populate('bracket.semifinals.match_id')
      .populate('bracket.semifinals.team1_id', 'country')
      .populate('bracket.semifinals.team2_id', 'country')
      .populate('bracket.final.match_id')
      .populate('bracket.final.team1_id', 'country')
      .populate('bracket.final.team2_id', 'country');
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user ? req.user.username : 'Guest',
      role: req.user ? req.user.role : 'N/A',
      message: null,
      error: null,
      tournament: tournament || null,
      user: req.user // Ensure user is passed
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user ? req.user.username : 'Guest',
      role: req.user ? req.user.role : 'N/A',
      error: 'Failed to load dashboard',
      message: null,
      tournament: null,
      user: req.user // Ensure user is passed
    });
  }
});

// ... (rest of the existing routes remain as provided earlier) ...
router.post('/start', async (req, res) => {
  try {
    const teams = await Team.find().lean();
    if (teams.length < 8) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        role: req.user.role,
        error: 'Need at least 8 teams',
        message: null,
        tournament: null,
        user: req.user
      });
    }

    const shuffled = [...teams].sort(() => 0.5 - Math.random());
    const validTeams = shuffled.slice(0, 8).filter(team => team._id && team._id.toString().length === 24);
    if (validTeams.length < 8) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        role: req.user.role,
        error: 'Not enough valid teams to pair for quarterfinals',
        message: null,
        tournament: null,
        user: req.user
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
          role: req.user.role,
          error: 'Invalid team data detected',
          message: null,
          tournament: null,
          user: req.user
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
        // tournament_id will be set below if applicable
      });
      await match.save();
      quarterfinals.push({ match_id: match._id, team1_id: team1._id, team2_id: team2._id });
    }

    // Create and save tournament after matches are created
    const tournamentData = {
      teams: validTeams.map(t => t._id),
      bracket: { quarterfinals, semifinals: [], final: [] },
      status: 'quarterfinals'
    };
    await Tournament.deleteMany({}); // Clear existing tournaments
    const tournament = await Tournament.create(tournamentData); // Ensure _id is available

    // Update matches with tournament_id if the schema includes it
    if ('tournament_id' in Match.schema.paths) {
      await Match.updateMany(
        { _id: { $in: quarterfinals.map(qf => qf.match_id) } },
        { $set: { tournament_id: tournament._id } }
      );
    }

    const populatedTournament = await Tournament.findOne(tournament._id)
      .populate('teams', 'country')
      .populate('bracket.quarterfinals.match_id')
      .populate('bracket.quarterfinals.team1_id', 'country')
      .populate('bracket.quarterfinals.team2_id', 'country')
      .populate('bracket.semifinals.match_id')
      .populate('bracket.semifinals.team1_id', 'country')
      .populate('bracket.semifinals.team2_id', 'country')
      .populate('bracket.final.match_id')
      .populate('bracket.final.team1_id', 'country')
      .populate('bracket.final.team2_id', 'country');

    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role,
      message: 'Tournament started successfully',
      error: null,
      tournament: populatedTournament,
      user: req.user
    });
  } catch (err) {
    console.error('Start tournament error:', err.message, err.stack);
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role,
      error: 'Failed to start tournament: ' + err.message,
      message: null,
      tournament: null,
      user: req.user
    });
  }
});

router.post('/simulate', async (req, res) => {
  try {
    const tournament = await Tournament.findOne()
      .populate('bracket.quarterfinals.match_id')
      .populate('bracket.quarterfinals.team1_id', 'country')
      .populate('bracket.quarterfinals.team2_id', 'country')
      .populate('bracket.semifinals.match_id')
      .populate('bracket.semifinals.team1_id', 'country')
      .populate('bracket.semifinals.team2_id', 'country')
      .populate('bracket.final.match_id')
      .populate('bracket.final.team1_id', 'country')
      .populate('bracket.final.team2_id', 'country');
    if (!tournament) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        role: req.user.role,
        error: 'Tournament not found',
        message: null,
        tournament: null,
        user: req.user
      });
    }

    let matchesToSimulate = [];
    if (tournament.status === 'quarterfinals') {
      matchesToSimulate = tournament.bracket.quarterfinals.map(qf => qf.match_id).filter(m => m);
    } else if (tournament.status === 'semifinals') {
      matchesToSimulate = tournament.bracket.semifinals.map(sf => sf.match_id).filter(m => m);
    } else if (tournament.status === 'final') {
      matchesToSimulate = tournament.bracket.final.map(f => f.match_id).filter(m => m);
    } else {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        role: req.user.role,
        error: 'No valid stage to simulate',
        message: null,
        tournament,
        user: req.user
      });
    }

    const pendingMatches = matchesToSimulate.filter(match => match && match.status === 'pending');
    if (pendingMatches.length === 0) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        role: req.user.role,
        error: 'No pending matches to simulate',
        message: null,
        tournament,
        user: req.user
      });
    }

    for (const match of pendingMatches) {
      match.score.team1 = Math.floor(Math.random() * 4);
      match.score.team2 = Math.floor(Math.random() * 4);
      match.type = 'simulated';
      match.status = 'completed';

      const maxGoals = Math.max(match.score.team1, match.score.team2);
      match.goal_scorers = [];
      for (let i = 0; i < maxGoals; i++) {
        if (i < match.score.team1) {
          match.goal_scorers.push({
            player_name: `Player${i + 1}_${match._id.toString().slice(-4)}`,
            minute: Math.floor(Math.random() * 90) + 1,
            team: 'team1'
          });
        }
        if (i < match.score.team2) {
          match.goal_scorers.push({
            player_name: `Player${i + 1}_${match._id.toString().slice(-4)}`,
            minute: Math.floor(Math.random() * 90) + 1,
            team: 'team2'
          });
        }
      }

      const team1Name = match.team1_id ? match.team1_id.country || 'Unknown' : 'Unknown';
      const team2Name = match.team2_id ? match.team2_id.country || 'Unknown' : 'Unknown';
      match.commentary = `Match simulated: ${team1Name} ${match.score.team1}-${match.score.team2} ${team2Name} with ${match.goal_scorers.length} goals`;

      if (!match.tournament_id) {
        match.tournament_id = tournament._id;
      }

      await match.save();
    }

    const updatedTournament = await Tournament.findOne(tournament._id)
      .populate('bracket.quarterfinals.match_id')
      .populate('bracket.quarterfinals.team1_id', 'country')
      .populate('bracket.quarterfinals.team2_id', 'country')
      .populate('bracket.semifinals.match_id')
      .populate('bracket.semifinals.team1_id', 'country')
      .populate('bracket.semifinals.team2_id', 'country')
      .populate('bracket.final.match_id')
      .populate('bracket.final.team1_id', 'country')
      .populate('bracket.final.team2_id', 'country');

    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role,
      message: 'Matches simulated successfully',
      error: null,
      tournament: updatedTournament || tournament,
      user: req.user
    });
  } catch (err) {
    console.error('Simulate matches error:', err.message, err.stack);
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role,
      error: 'Failed to simulate matches: ' + err.message,
      message: null,
      tournament: null,
      user: req.user
    });
  }
});

router.post('/play', async (req, res) => {
  try {
    const tournament = await Tournament.findOne()
      .populate('bracket.quarterfinals.match_id')
      .populate('bracket.semifinals.match_id')
      .populate('bracket.final.match_id');
    if (!tournament) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        role: req.user.role,
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

    const pendingMatches = matchesToPlay.filter(match => match && match.status === 'pending');
    if (pendingMatches.length === 0) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        role: req.user.role,
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
      role: req.user.role,
      message: 'Matches played successfully',
      error: null,
      tournament
    });
  } catch (err) {
    console.error('Play matches error:', err.message);
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role,
      error: 'Failed to play matches',
      message: null,
      tournament: null
    });
  }
});

router.post('/advance', async (req, res) => {
  try {
    const tournament = await Tournament.findOne()
      .populate('bracket.quarterfinals.match_id')
      .populate('bracket.quarterfinals.team1_id', 'country')
      .populate('bracket.quarterfinals.team2_id', 'country')
      .populate('bracket.semifinals.match_id')
      .populate('bracket.semifinals.team1_id', 'country')
      .populate('bracket.semifinals.team2_id', 'country')
      .populate('bracket.final.match_id')
      .populate('bracket.final.team1_id', 'country')
      .populate('bracket.final.team2_id', 'country');

    if (!tournament) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        role: req.user.role,
        error: 'Tournament not found',
        message: null,
        tournament: null,
        user: req.user
      });
    }

    console.log('Tournament status:', tournament.status);
    console.log('Bracket data:', JSON.stringify(tournament.bracket, null, 2));

    if (tournament.status === 'quarterfinals') {
      const allQuarterfinalsCompleted = tournament.bracket.quarterfinals.every(qf => {
        const match = qf.match_id;
        return match && match.status === 'completed';
      });
      if (!allQuarterfinalsCompleted) {
        return res.render('admin_dashboard', {
          title: 'Admin Dashboard',
          username: req.user.username,
          role: req.user.role,
          error: 'All quarterfinal matches must be completed',
          message: null,
          tournament,
          user: req.user
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
            match1.commentary += `; Extra time goal decided winner: ${winner1.country || 'Unknown'}`;
          } else {
            const penaltyWin = Math.random() < 0.5;
            winner1 = penaltyWin ? tournament.bracket.quarterfinals[i].team1_id : tournament.bracket.quarterfinals[i].team2_id;
            match1.commentary += `; Penalty shootout won by: ${winner1.country || 'Unknown'}`;
          }
          await match1.save();
        }
        if (match2.score.team1 === match2.score.team2) {
          const extraTimeGoal = Math.random() < 0.5 ? 1 : 0;
          if (extraTimeGoal === 1) {
            winner2 = Math.random() < 0.5 ? tournament.bracket.quarterfinals[i + 1].team1_id : tournament.bracket.quarterfinals[i + 1].team2_id;
            match2.commentary += `; Extra time goal decided winner: ${winner2.country || 'Unknown'}`;
          } else {
            const penaltyWin = Math.random() < 0.5;
            winner2 = penaltyWin ? tournament.bracket.quarterfinals[i + 1].team1_id : tournament.bracket.quarterfinals[i + 1].team2_id;
            match2.commentary += `; Penalty shootout won by: ${winner2.country || 'Unknown'}`;
          }
          await match2.save();
        }

        const match = new Match({
          stage: 'semifinal',
          team1_id: winner1._id,
          team2_id: winner2._id,
          type: 'simulated',
          status: 'pending',
          score: { team1: 0, team2: 0 },
          goal_scorers: [],
          commentary: '',
          tournament_id: tournament._id // Added to satisfy validation
        });
        await match.save();
        semifinalMatches.push({ match_id: match._id, team1_id: winner1._id, team2_id: winner2._id });
      }
      tournament.bracket.semifinals = semifinalMatches;
      tournament.status = 'semifinals';
      await tournament.save();
      const updatedTournament = await Tournament.findOne(tournament._id)
        .populate('bracket.quarterfinals.match_id')
        .populate('bracket.quarterfinals.team1_id', 'country')
        .populate('bracket.quarterfinals.team2_id', 'country')
        .populate('bracket.semifinals.match_id')
        .populate('bracket.semifinals.team1_id', 'country')
        .populate('bracket.semifinals.team2_id', 'country')
        .populate('bracket.final.match_id')
        .populate('bracket.final.team1_id', 'country')
        .populate('bracket.final.team2_id', 'country');
      res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        role: req.user.role,
        message: 'Semifinals set up successfully',
        error: null,
        tournament: updatedTournament || tournament,
        user: req.user
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
          role: req.user.role,
          error: 'All semifinal matches must be completed',
          message: null,
          tournament,
          user: req.user
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
            match1.commentary += `; Extra time goal decided winner: ${winner1.country || 'Unknown'}`;
          } else {
            const penaltyWin = Math.random() < 0.5;
            winner1 = penaltyWin ? tournament.bracket.semifinals[i].team1_id : tournament.bracket.semifinals[i].team2_id;
            match1.commentary += `; Penalty shootout won by: ${winner1.country || 'Unknown'}`;
          }
          await match1.save();
        }
        if (match2.score.team1 === match2.score.team2) {
          const extraTimeGoal = Math.random() < 0.5 ? 1 : 0;
          if (extraTimeGoal === 1) {
            winner2 = Math.random() < 0.5 ? tournament.bracket.semifinals[i + 1].team1_id : tournament.bracket.semifinals[i + 1].team2_id;
            match2.commentary += `; Extra time goal decided winner: ${winner2.country || 'Unknown'}`;
          } else {
            const penaltyWin = Math.random() < 0.5;
            winner2 = penaltyWin ? tournament.bracket.semifinals[i + 1].team1_id : tournament.bracket.semifinals[i + 1].team2_id;
            match2.commentary += `; Penalty shootout won by: ${winner2.country || 'Unknown'}`;
          }
          await match2.save();
        }

        const match = new Match({
          stage: 'final',
          team1_id: winner1._id,
          team2_id: winner2._id,
          type: 'simulated',
          status: 'pending',
          score: { team1: 0, team2: 0 },
          goal_scorers: [],
          commentary: '',
          tournament_id: tournament._id // Added to satisfy validation
        });
        await match.save();
        finalMatches.push({ match_id: match._id, team1_id: winner1._id, team2_id: winner2._id });
      }
      tournament.bracket.final = finalMatches;
      tournament.status = 'final';
      await tournament.save();
      const updatedTournament = await Tournament.findOne(tournament._id)
        .populate('bracket.quarterfinals.match_id')
        .populate('bracket.quarterfinals.team1_id', 'country')
        .populate('bracket.quarterfinals.team2_id', 'country')
        .populate('bracket.semifinals.match_id')
        .populate('bracket.semifinals.team1_id', 'country')
        .populate('bracket.semifinals.team2_id', 'country')
        .populate('bracket.final.match_id')
        .populate('bracket.final.team1_id', 'country')
        .populate('bracket.final.team2_id', 'country');
      res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        role: req.user.role,
        message: 'Final set up successfully',
        error: null,
        tournament: updatedTournament || tournament,
        user: req.user
      });
    } else if (tournament.status === 'final') {
      const finalMatch = tournament.bracket.final[0].match_id;
      if (finalMatch && finalMatch.status !== 'completed') {
        return res.render('admin_dashboard', {
          title: 'Admin Dashboard',
          username: req.user.username,
          role: req.user.role,
          error: 'Final match must be completed',
          message: null,
          tournament,
          user: req.user
        });
      }
      tournament.status = 'completed';
      await tournament.save();
      res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        role: req.user.role,
        message: 'Tournament completed successfully',
        error: null,
        tournament,
        user: req.user
      });
    }

    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role,
      error: 'No further stages to advance',
      message: null,
      tournament,
      user: req.user
    });
  } catch (err) {
    console.error('Advance stage error:', err.message, err.stack);
    res.status(500).render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role,
      error: 'Failed to advance stage: ' + err.message,
      message: null,
      tournament: null,
      user: req.user
    });
  }
});

router.post('/restart', async (req, res) => {
  try {
    const tournament = await Tournament.findOne().sort({ createdAt: -1 }); // Get the most recent tournament
    if (tournament) {
      tournament.status = 'completed';
      const pastTournament = new PastTournament({
        ...tournament.toObject(),
        year: new Date().getFullYear()
      });
      await pastTournament.save();
      console.log('Archived tournament:', pastTournament._id);
    }
    const deleteTournamentResult = await Tournament.deleteMany({});
    const deleteMatchResult = await Match.deleteMany({});
    console.log('Deleted tournaments:', deleteTournamentResult.deletedCount);
    console.log('Deleted matches:', deleteMatchResult.deletedCount);

    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role,
      message: 'Tournament reset and archived successfully',
      error: null,
      tournament: null, // Explicitly set to null to indicate no active tournament
      user: req.user
    });
  } catch (err) {
    console.error('Restart tournament error:', err.message, err.stack);
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role,
      error: 'Failed to reset tournament: ' + err.message,
      message: null,
      tournament: null,
      user: req.user
    });
  }
});

router.post('/edit-match', async (req, res) => {
  try {
    const { matchId, team1Score, team2Score } = req.body;
    const match = await Match.findById(matchId);
    if (!match) {
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        role: req.user.role,
        error: 'Match not found',
        message: null,
        tournament: await Tournament.findOne()
          .populate('bracket.quarterfinals.match_id')
          .populate('bracket.quarterfinals.team1_id', 'country')
          .populate('bracket.quarterfinals.team2_id', 'country')
          .populate('bracket.semifinals.match_id')
          .populate('bracket.semifinals.team1_id', 'country')
          .populate('bracket.semifinals.team2_id', 'country')
          .populate('bracket.final.match_id')
          .populate('bracket.final.team1_id', 'country')
          .populate('bracket.final.team2_id', 'country')
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
      role: req.user.role,
      message: 'Match score updated successfully',
      error: null,
      tournament: await Tournament.findOne()
        .populate('bracket.quarterfinals.match_id')
        .populate('bracket.quarterfinals.team1_id', 'country')
        .populate('bracket.quarterfinals.team2_id', 'country')
        .populate('bracket.semifinals.match_id')
        .populate('bracket.semifinals.team1_id', 'country')
        .populate('bracket.semifinals.team2_id', 'country')
        .populate('bracket.final.match_id')
        .populate('bracket.final.team1_id', 'country')
        .populate('bracket.final.team2_id', 'country')
    });
  } catch (err) {
    console.error('Edit match error:', err.message);
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role,
      error: 'Failed to update match score',
      message: null,
      tournament: null
    });
  }
});

module.exports = router;