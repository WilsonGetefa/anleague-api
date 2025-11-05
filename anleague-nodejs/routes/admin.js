const express = require('express');
const router = express.Router();
const Tournament = require('../models/tournament');
const Team = require('../models/team');
const Match = require('../models/match');
const PastTournament = require('../models/pastTournament'); // For archiving
const mongoose = require('mongoose'); // ← ADD THIS AT TOP OF FILE
const { authMiddleware } = require('../middleware/auth');     // ← Pull function out
const adminOnly = require('../middleware/adminOnly');
const User = require('../models/user');

// Add this at the top with other routes in routes/admin.js
router.get('/dashboard', async (req, res) => {
  try {
    const tournament = await Tournament.findOne()
    .populate({path: 'bracket.quarterfinals.match_id'})
    .populate({path: 'bracket.quarterfinals.team1_id',select: 'country'})
    .populate({path: 'bracket.quarterfinals.team2_id',select: 'country'})

    .populate({path: 'bracket.semifinals.match_id'})
    .populate({path: 'bracket.semifinals.team1_id',select: 'country'})
    .populate({path: 'bracket.semifinals.team2_id',select: 'country'})

    .populate({path: 'bracket.final.match_id'})
    .populate({path: 'bracket.final.team1_id',select: 'country'})
    .populate({path: 'bracket.final.team2_id',select: 'country'});
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
        .populate({path: 'bracket.quarterfinals.match_id'})
        .populate({path: 'bracket.quarterfinals.team1_id',select: 'country'})
        .populate({path: 'bracket.quarterfinals.team2_id',select: 'country'})

        .populate({path: 'bracket.semifinals.match_id'})
        .populate({path: 'bracket.semifinals.team1_id',select: 'country'})
        .populate({path: 'bracket.semifinals.team2_id',select: 'country'})

        .populate({path: 'bracket.final.match_id'})
        .populate({path: 'bracket.final.team1_id',select: 'country'})
        .populate({path: 'bracket.final.team2_id',select: 'country'});

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
      //.populate('bracket.quarterfinals.match_id')
      //.populate('bracket.quarterfinals.team1_id', 'country')
      //.populate('bracket.quarterfinals.team2_id', 'country')

        .populate({path: 'bracket.quarterfinals.match_id'})
        .populate({path: 'bracket.quarterfinals.team1_id',select: 'country'})
        .populate({path: 'bracket.quarterfinals.team2_id',select: 'country'})

        .populate({path: 'bracket.semifinals.match_id'})
        .populate({path: 'bracket.semifinals.team1_id',select: 'country'})
        .populate({path: 'bracket.semifinals.team2_id',select: 'country'})

        .populate({path: 'bracket.final.match_id'})
        .populate({path: 'bracket.final.team1_id',select: 'country'})
        .populate({path: 'bracket.final.team2_id',select: 'country'});

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

      
      // Inside the loop
      const team1IdRaw = match.team1_id?._id || match.team1_id;
      const team2IdRaw = match.team2_id?._id || match.team2_id;

      const team1Id = mongoose.Types.ObjectId.isValid(team1IdRaw) ? team1IdRaw : null;
      const team2Id = mongoose.Types.ObjectId.isValid(team2IdRaw) ? team2IdRaw : null;

      console.log(`Match ID: ${match._id}`);
      console.log(`team1Id raw: ${team1IdRaw} | valid: ${mongoose.Types.ObjectId.isValid(team1IdRaw)}`);
      console.log(`team2Id raw: ${team2IdRaw} | valid: ${mongoose.Types.ObjectId.isValid(team2IdRaw)}`);

      const team1 = team1Id ? await Team.findById(team1Id).select('squad.name country').lean() : null;
      const team2 = team2Id ? await Team.findById(team2Id).select('squad.name country').lean() : null;

      const team1Name = team1?.country || 'Unknown';
      const team2Name = team2?.country || 'Unknown';

      console.log(`Team1: ${team1Name} | Squad: ${team1?.squad?.length} players`);
      console.log(`Team2: ${team2Name} | Squad: ${team2?.squad?.length} players`);
      console.log('Sample player:', team1?.squad?.[0]?.name);

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
        console.warn(`No players for team1 ${team1Name}`);//, using placeholders`);
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
        console.warn(`No players for team2 ${team2Name}`);//, using placeholders`);
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
      console.log('Team1 squad:', team1?.squad?.map(p => p.name));
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
      .populate({path: 'bracket.quarterfinals.match_id'})
    .populate({path: 'bracket.semifinals.match_id'})
    .populate({path: 'bracket.final.match_id'});
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
        .populate({path: 'bracket.quarterfinals.match_id'})
        .populate({path: 'bracket.quarterfinals.team1_id',select: 'country'})
        .populate({path: 'bracket.quarterfinals.team2_id',select: 'country'})

        .populate({path: 'bracket.semifinals.match_id'})
        .populate({path: 'bracket.semifinals.team1_id',select: 'country'})
        .populate({path: 'bracket.semifinals.team2_id',select: 'country'})

        .populate({path: 'bracket.final.match_id'})
        .populate({path: 'bracket.final.team1_id',select: 'country'})
        .populate({path: 'bracket.final.team2_id',select: 'country'});

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
        return res.render('admin_dashboard', { 
        error: 'Not enough quarterfinals', 
        tournament, 
        user: req.user 
        });
      }

      const allCompleted = qfs.every(qf => qf.match_id?.status === 'completed');
      if (!allCompleted) {
        return res.render('admin_dashboard', { 
        error: 'All quarterfinals must be completed', 
        tournament, 
        user: req.user 
        });
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
          return res.render('admin_dashboard', { 
          error: 'Could not determine semifinalists', 
          tournament, 
          user: req.user 
          });
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
        return res.render('admin_dashboard', { 
        error: 'Not enough semifinals', 
        tournament, 
        user: req.user 
        });
      }

      const allCompleted = sfs.every(sf => sf.match_id?.status === 'completed');
      if (!allCompleted) {
        return res.render('admin_dashboard', { 
        error: 'All semifinals must be completed', 
        tournament, 
        user: req.user 
        });
      }

      const m1 = sfs[0].match_id, m2 = sfs[1].match_id;
      const t1 = sfs[0].team1_id, t2 = sfs[0].team2_id;
      const t3 = sfs[1].team1_id, t4 = sfs[1].team2_id;

      const finalist1 = await resolveWinner(m1, t1, t2);
      const finalist2 = await resolveWinner(m2, t3, t4);

      if (!finalist1 || !finalist2) {
        return res.render('admin_dashboard', { 
        error: 'Could not determine finalists', 
        tournament, 
        user: req.user 
        });
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
        return res.render('admin_dashboard', { 
        error: 'Final match must be completed', 
        tournament, 
        user: req.user 
        });
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
      return res.render('admin_dashboard', {
        title: 'Admin Dashboard',
        username: req.user.username,
        role: req.user.role,
        error: 'No stage to advance',
        message: null,
        tournament,
        user: req.user
      });
    }

    // === RELOAD WITH FRESH POPULATION ===
    const updated = await Tournament.findById(tournament._id)
        .populate({path: 'bracket.quarterfinals.match_id'})
        .populate({path: 'bracket.quarterfinals.team1_id',select: 'country'})
        .populate({path: 'bracket.quarterfinals.team2_id',select: 'country'})

        .populate({path: 'bracket.semifinals.match_id'})
        .populate({path: 'bracket.semifinals.team1_id',select: 'country'})
        .populate({path: 'bracket.semifinals.team2_id',select: 'country'})

        .populate({path: 'bracket.final.match_id'})
        .populate({path: 'bracket.final.team1_id',select: 'country'})
        .populate({path: 'bracket.final.team2_id',select: 'country'});

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
router.post('/restart', async (req, res) => {
  try {
    const tournament = await Tournament.findOne().sort({ createdAt: -1 });

    let archived = null;

    if (tournament) {
      // === ARCHIVE FIRST ===
      const { _id, ...cleanData } = tournament.toObject();

      const pastTournament = new PastTournament({
        ...cleanData,
        year: new Date().getFullYear(),
        bracket: {
          quarterfinals: (cleanData.bracket?.quarterfinals || []).map(qf => ({
            team1_id: qf.team1_id?._id || qf.team1_id,
            team2_id: qf.team2_id?._id || qf.team2_id,
            match_id: qf.match_id?._id || qf.match_id
          })),
          semifinals: (cleanData.bracket?.semifinals || []).map(sf => ({
            team1_id: sf.team1_id?._id || sf.team1_id,
            team2_id: sf.team2_id?._id || sf.team2_id,
            match_id: sf.match_id?._id || sf.match_id
          })),
          final: (cleanData.bracket?.final || []).map(f => ({
            team1_id: f.team1_id?._id || f.team1_id,
            team2_id: f.team2_id?._id || f.team2_id,
            match_id: f.match_id?._id || f.match_id
          }))
        }
      });

      archived = await pastTournament.save();
      console.log('Archived tournament:', archived._id);

      // === NOW DELETE THE ORIGINAL ===
      const deleteResult = await Tournament.deleteOne({ _id: tournament._id });
      console.log('Deleted active tournament:', deleteResult.deletedCount); // Should be 1
    } else {
      console.log('No tournament to restart');
    }

    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role,
      message: archived 
        ? 'Tournament archived and fully reset'
        : 'No tournament to restart',
      error: null,
      tournament: null,
      user: req.user
    });

  } catch (err) {
    console.error('Restart error:', err);
    res.status(500).render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user.username,
      role: req.user.role,
      error: 'Restart failed: ' + err.message,
      message: null,
      tournament: null,
      user: req.user
    });
  }
});

// routes/admin.js
router.post('/edit-match', async (req, res) => {
  try {
    const { matchId, team1Score, team2Score } = req.body;

    // Validate input
    if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
      return renderAdminError(res, req, 'Invalid match ID');
    }

    const team1ScoreNum = parseInt(team1Score);
    const team2ScoreNum = parseInt(team2Score);
    if (isNaN(team1ScoreNum) || isNaN(team2ScoreNum) || team1ScoreNum < 0 || team2ScoreNum < 0) {
      return renderAdminError(res, req, 'Invalid scores');
    }

    // Find and update match
    const match = await Match.findById(matchId);
    if (!match) {
      return renderAdminError(res, req, 'Match not found');
    }

    match.score.team1 = team1ScoreNum;
    match.score.team2 = team2ScoreNum;
    match.status = 'completed';
    match.commentary = `Score updated manually: ${team1ScoreNum}–${team2ScoreNum}`;
    match.type = 'played'; // or 'simulated' — your choice

    await match.save();

    // Reload tournament with full population
    const tournament = await Tournament.findOne()
      .populate({ path: 'bracket.quarterfinals.match_id' })
      .populate({ path: 'bracket.quarterfinals.team1_id', select: 'country' })
      .populate({ path: 'bracket.quarterfinals.team2_id', select: 'country' })
      .populate({ path: 'bracket.semifinals.match_id' })
      .populate({ path: 'bracket.semifinals.team1_id', select: 'country' })
      .populate({ path: 'bracket.semifinals.team2_id', select: 'country' })
      .populate({ path: 'bracket.final.match_id' })
      .populate({ path: 'bracket.final.team1_id', select: 'country' })
      .populate({ path: 'bracket.final.team2_id', select: 'country' });

    // Success render
    res.render('admin_dashboard', {
      title: 'Admin Dashboard',
      username: req.user?.username || 'Guest',
      role: req.user?.role || 'N/A',
      message: 'Match score updated successfully',
      error: null,
      tournament,
      user: req.user
    });

  } catch (err) {
    console.error('Edit match error:', err.message, err.stack);
    renderAdminError(res, req, 'Failed to update match: ' + err.message);
  }
});

// ADMIN DATA ROUTES
router.get('/data', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [
      users,
      teams,
      tournament,          // <-- active tournament (singular)
      matches,
      pasttournaments
    ] = await Promise.all([
      User.find().lean(),
      Team.find().populate('representative_id', 'username').lean(),
      Tournament.findOne().lean(),                         // current
      Match.find()
        .populate('team1_id', 'country')
        .populate('team2_id', 'country')
        .lean(),
      PastTournament.find().lean()                         // <-- YOUR MODEL
    ]);

    res.render('admin_data', {
      title: 'Admin Data Overview',
      user: req.user,
      users: users || [],
      teams: teams || [],
      tournament: tournament || null,          // <-- NEW
      matches: matches || [],
      pasttournaments: pasttournaments || [],
      message: req.query.message || null,
      error: null
    });
  } catch (err) {
    console.error('Admin Data Error:', err);
    res.render('admin_data', {
      title: 'Admin Data Overview',
      user: req.user,
      users: [], teams: [], tournament: null,
      matches: [], pasttournaments: [],
      error: 'Failed to load data: ' + err.message
    });
  }
});

// DELETE ROUTES
// DELETE ROUTES
router.post('/delete-user/:id', authMiddleware, adminOnly, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/admin/data?message=User deleted');
});

router.post('/delete-all-users', authMiddleware, adminOnly, async (req, res) => {
  await User.deleteMany({});
  res.redirect('/admin/data?message=All users deleted');
});

router.post('/delete-team/:id', authMiddleware, adminOnly, async (req, res) => {
  await Team.findByIdAndDelete(req.params.id);
  res.redirect('/admin/data?message=Team deleted');
});

router.post('/delete-all-teams', authMiddleware, adminOnly, async (req, res) => {
  await Team.deleteMany({});
  res.redirect('/admin/data?message=All teams deleted');
});

// Active Tournament (singular)
router.post('/delete-tournament/:id', authMiddleware, adminOnly, async (req, res) => {
  await Tournament.findByIdAndDelete(req.params.id);
  res.redirect('/admin/data?message=Active tournament deleted');
});

// Past Tournaments
router.post('/delete-pasttournaments/:id', authMiddleware, adminOnly, async (req, res) => {
  await PastTournament.findByIdAndDelete(req.params.id);
  res.redirect('/admin/data?message=Past tournament deleted');
});

router.post('/delete-all-pasttournaments', authMiddleware, adminOnly, async (req, res) => {
  await PastTournament.deleteMany({});
  res.redirect('/admin/data?message=All past tournaments deleted');
});

router.post('/delete-match/:id', authMiddleware, adminOnly, async (req, res) => {
  await Match.findByIdAndDelete(req.params.id);
  res.redirect('/admin/data?message=Match deleted');
});

router.post('/delete-all-matches', authMiddleware, adminOnly, async (req, res) => {
  await Match.deleteMany({});
  res.redirect('/admin/data?message=All matches deleted');
});

module.exports = router;