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

    // Create and save tournament first to get _id
    const tournamentData = {
      teams: validTeams.map(t => t._id),
      bracket: { quarterfinals: [], semifinals: [], final: [] },
      status: 'quarterfinals'
    };
    await Tournament.deleteMany({}); // Clear existing tournaments
    const tournament = await Tournament.create(tournamentData); // Save to get _id

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
        commentary: '',
        tournament_id: tournament._id // Set tournament_id here
      });
      await match.save();
      quarterfinals.push({ match_id: match._id, team1_id: team1._id, team2_id: team2._id });
    }

    // Update tournament with quarterfinals
    tournament.bracket.quarterfinals = quarterfinals;
    await tournament.save();

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

// routes/admin.js (only the /simulate route)
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
      matchesToSimulate = tournament.bracket.quarterfinals.map(qf => qf.match_id).filter(Boolean);
    } else if (tournament.status === 'semifinals') {
      matchesToSimulate = tournament.bracket.semifinals.map(sf => sf.match_id).filter(Boolean);
    } else if (tournament.status === 'final') {
      matchesToSimulate = tournament.bracket.final.map(f => f.match_id).filter(Boolean);
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

    // Simulate each match
    for (const match of pendingMatches) {
      match.score.team1 = Math.floor(Math.random() * 4);
      match.score.team2 = Math.floor(Math.random() * 4);
      match.type = 'simulated';
      match.status = 'completed';
      match.goal_scorers = [];

      // Safe team data retrieval
      const team1 = await Team.findById(match.team1_id).select('squad country').lean();
      const team2 = await Team.findById(match.team2_id).select('squad country').lean();

      const team1Name = team1?.country || 'Unknown';
      const team2Name = team2?.country || 'Unknown';

      // Generate goals with safe player selection
      if (team1?.squad?.length) {
        for (let i = 0; i < match.score.team1; i++) {
          const player = team1.squad[Math.floor(Math.random() * team1.squad.length)];
          match.goal_scorers.push({
            player_name: player.name || `Player${i + 1}_T1`,
            minute: Math.floor(Math.random() * 90) + 1,
            team: 'team1'
          });
        }
      } else {
        console.warn(`No players for team1 ${team1Name}, using placeholders`);
        for (let i = 0; i < match.score.team1; i++) {
          match.goal_scorers.push({
            player_name: `Player${i + 1}_T1`,
            minute: Math.floor(Math.random() * 90) + 1,
            team: 'team1'
          });
        }
      }

      if (team2?.squad?.length) {
        for (let i = 0; i < match.score.team2; i++) {
          const player = team2.squad[Math.floor(Math.random() * team2.squad.length)];
          match.goal_scorers.push({
            player_name: player.name || `Player${i + 1}_T2`,
            minute: Math.floor(Math.random() * 90) + 1,
            team: 'team2'
          });
        }
      } else {
        console.warn(`No players for team2 ${team2Name}, using placeholders`);
        for (let i = 0; i < match.score.team2; i++) {
          match.goal_scorers.push({
            player_name: `Player${i + 1}_T2`,
            minute: Math.floor(Math.random() * 90) + 1,
            team: 'team2'
          });
        }
      }

      // Commentary
      match.commentary = `Match simulated: ${team1Name} ${match.score.team1}-${match.score.team2} ${team2Name} with ${match.goal_scorers.length} goals`;
      match.tournament_id = tournament._id;

      await match.save();
    }

    const updatedTournament = await Tournament.findById(tournament._id)
      .populate({ path: 'bracket.quarterfinals.match_id' })
      .populate({ path: 'bracket.quarterfinals.team1_id', select: 'country' })
      .populate({ path: 'bracket.quarterfinals.team2_id', select: 'country' })
      .populate({ path: 'bracket.semifinals.match_id' })
      .populate({ path: 'bracket.semifinals.team1_id', select: 'country' })
      .populate({ path: 'bracket.semifinals.team2_id', select: 'country' })
      .populate({ path: 'bracket.final.match_id' })
      .populate({ path: 'bracket.final.team1_id', select: 'country' })
      .populate({ path: 'bracket.final.team2_id', select: 'country' });

    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role,
      message: 'Matches simulated successfully',
      error: null,
      tournament: updatedTournament,
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

// routes/admin.js
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

    // Helper: resolve winner with tiebreaker
    const resolveWinner = async (match, team1Doc, team2Doc) => {
      if (!match || match.status !== 'completed') return null;

      if (match.score.team1 !== match.score.team2) {
        return match.score.team1 > match.score.team2 ? team1Doc : team2Doc;
      }

      // Tie → extra time or penalties
      const isExtraTime = Math.random() < 0.5;
      const winner = Math.random() < 0.5 ? team1Doc : team2Doc;
      const winnerName = winner?.country || 'Unknown';

      if (isExtraTime) {
        match.commentary += `; Extra time goal: ${winnerName} wins!`;
      } else {
        match.commentary += `; Penalty shootout: ${winnerName} wins!`;
      }
      await match.save();
      return winner;
    };

    // === QUARTERFINALS → SEMIFINALS ===
    if (tournament.status === 'quarterfinals') {
      const qfs = tournament.bracket.quarterfinals;
      if (qfs.length < 4) {
        return res.render('admin_dashboard', { error: 'Not enough quarterfinals', tournament, user: req.user });
      }

      const allCompleted = qfs.every(qf => qf.match_id?.status === 'completed');
      if (!allCompleted) {
        return res.render('admin_dashboard', { error: 'All quarterfinals must be completed', tournament, user: req.user });
      }

      const semifinalPairs = [];
      for (let i = 0; i < 4; i += 2) {
        const m1 = qfs[i].match_id;
        const m2 = qfs[i + 1].match_id;
        const t1 = qfs[i].team1_id, t2 = qfs[i].team2_id;
        const t3 = qfs[i + 1].team1_id, t4 = qfs[i + 1].team2_id;

        const winner1 = await resolveWinner(m1, t1, t2);
        const winner2 = await resolveWinner(m2, t3, t4);

        if (!winner1 || !winner2) {
          return res.render('admin_dashboard', { error: 'Could not determine semifinalists', tournament, user: req.user });
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
          tournament_id: tournament._id
        });
        await match.save();

        semifinalPairs.push({
          match_id: match._id,
          team1_id: winner1._id,
          team2_id: winner2._id
        });
      }

      tournament.bracket.semifinals = semifinalPairs;
      tournament.status = 'semifinals';
      await tournament.save();
    }

    // === SEMIFINALS → FINAL ===
    else if (tournament.status === 'semifinals') {
      const sfs = tournament.bracket.semifinals;
      if (sfs.length < 2) {
        return res.render('admin_dashboard', { error: 'Not enough semifinals', tournament, user: req.user });
      }

      const allCompleted = sfs.every(sf => sf.match_id?.status === 'completed');
      if (!allCompleted) {
        return res.render('admin_dashboard', { error: 'All semifinals must be completed', tournament, user: req.user });
      }

      const m1 = sfs[0].match_id, m2 = sfs[1].match_id;
      const t1 = sfs[0].team1_id, t2 = sfs[0].team2_id;
      const t3 = sfs[1].team1_id, t4 = sfs[1].team2_id;

      const finalist1 = await resolveWinner(m1, t1, t2);
      const finalist2 = await resolveWinner(m2, t3, t4);

      if (!finalist1 || !finalist2) {
        return res.render('admin_dashboard', { error: 'Could not determine finalists', tournament, user: req.user });
      }

      const finalMatch = new Match({
        stage: 'final',
        team1_id: finalist1._id,
        team2_id: finalist2._id,
        type: 'simulated',
        status: 'pending',
        score: { team1: 0, team2: 0 },
        goal_scorers: [],
        commentary: '',
        tournament_id: tournament._id
      });
      await finalMatch.save();

      tournament.bracket.final = [{
        match_id: finalMatch._id,
        team1_id: finalist1._id,
        team2_id: finalist2._id
      }];
      tournament.status = 'final';
      await tournament.save();
    }

    // === FINAL → ARCHIVE ===
    else if (tournament.status === 'final') {
      const final = tournament.bracket.final[0];
      if (!final?.match_id || final.match_id.status !== 'completed') {
        return res.render('admin_dashboard', { error: 'Final match must be completed', tournament, user: req.user });
      }

      // Build clean bracket for archiving (no populated objects)
      const cleanBracket = {
        quarterfinals: tournament.bracket.quarterfinals.map(qf => ({
          team1_id: qf.team1_id?._id,
          team2_id: qf.team2_id?._id,
          match_id: qf.match_id?._id
        })),
        semifinals: tournament.bracket.semifinals.map(sf => ({
          team1_id: sf.team1_id?._id,
          team2_id: sf.team2_id?._id,
          match_id: sf.match_id?._id
        })),
        final: [{
          team1_id: final.team1_id?._id,
          team2_id: final.team2_id?._id,
          match_id: final.match_id?._id
        }]
      };

      const past = new PastTournament({
        year: new Date().getFullYear(),
        bracket: cleanBracket,
        status: 'completed'
      });
      await past.save();

      tournament.status = 'completed';
      await tournament.save();
    }

    else {
      return res.render('admin_dashboard', { error: 'No stage to advance', tournament, user: req.user });
    }

    // === RELOAD WITH FRESH POPULATION ===
    const updated = await Tournament.findById(tournament._id)
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
      message: `${tournament.status === 'completed' ? 'Tournament' : 'Stage'} advanced successfully`,
      error: null,
      tournament: updated,
      user: req.user
    });

  } catch (err) {
    console.error('Advance error:', err);
    res.status(500).render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role,
      error: 'Advance failed: ' + err.message,
      message: null,
      tournament: null,
      user: req.user
    });
  }
});

// routes/admin.js
// routes/admin.js – /restart
router.post('/restart', async (req, res) => {
  try {
    const tournament = await Tournament.findOne().sort({ createdAt: -1 });
    let archived = null;

    if (tournament) {
      // Remove _id and any populated refs before saving
      const { _id, ...cleanData } = tournament.toObject();

      const pastTournament = new PastTournament({
        ...cleanData,
        year: new Date().getFullYear(),
        // Optionally clean up populated refs
        bracket: {
          quarterfinals: cleanData.bracket?.quarterfinals?.map(qf => ({
            team1_id: qf.team1_id?._id || qf.team1_id,
            team2_id: qf.team2_id?._id || qf.team2_id,
            match_id: qf.match_id?._id || qf.match_id
          })) || [],
          semifinals: cleanData.bracket?.semifinals?.map(sf => ({
            team1_id: sf.team1_id?._id || sf.team1_id,
            team2_id: sf.team2_id?._id || sf.team2_id,
            match_id: sf.match_id?._id || sf.match_id
          })) || [],
          final: cleanData.bracket?.final?.map(f => ({
            team1_id: f.team1_id?._id || f.team1_id,
            team2_id: f.team2_id?._id || f.team2_id,
            match_id: f.match_id?._id || f.match_id
          })) || []
        }
      });

      archived = await pastTournament.save();
      console.log('Archived tournament:', archived._id);
    }

    // Delete ALL non-completed tournaments
    const deleteResult = await Tournament.deleteMany({ status: { $ne: 'completed' } });
    console.log('Deleted active tournaments:', deleteResult.deletedCount);

    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role,
      message: 'Tournament reset and archived successfully',
      error: null,
      tournament: null,
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