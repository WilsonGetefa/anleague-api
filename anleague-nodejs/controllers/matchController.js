const Match = require('../models/match');
const Team = require('../models/team');
const User = require('../models/user');
const { OpenAI } = require('openai');
const nodemailer = require('nodemailer');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

exports.simulateMatch = async (req, res) => {
  const { match_id } = req.body;
  try {
    const match = await Match.findById(match_id).populate('team1_id team2_id');
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const score = { team1: Math.floor(Math.random() * 5), team2: Math.floor(Math.random() * 5) };
    const goal_scorers = [];
    for (let i = 0; i < score.team1; i++) {
      const player = match.team1_id.squad[Math.floor(Math.random() * match.team1_id.squad.length)];
      goal_scorers.push({ player_name: player.name, minute: Math.floor(Math.random() * 90) + 1, team: 'team1' });
      player.goals += 1; // Update player goals
    }
    for (let i = 0; i < score.team2; i++) {
      const player = match.team2_id.squad[Math.floor(Math.random() * match.team2_id.squad.length)];
      goal_scorers.push({ player_name: player.name, minute: Math.floor(Math.random() * 90) + 1, team: 'team2' });
      player.goals += 1; // Update player goals
    }

    match.score = score;
    match.goal_scorers = goal_scorers;
    match.type = 'simulated';
    await match.save();

    // Update team documents to persist player goals
    await Team.updateOne({ _id: match.team1_id._id }, { squad: match.team1_id.squad });
    await Team.updateOne({ _id: match.team2_id._id }, { squad: match.team2_id.squad });

    const [rep1, rep2] = await Promise.all([
      User.findById(match.team1_id.userId), // Changed from representative_id
      User.findById(match.team2_id.userId)  // Changed from representative_id
    ]);

    if (rep1 && rep2) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: [rep1.email, rep2.email],
        subject: 'Match Result',
        text: `Result: ${match.team1_id.country} ${score.team1} - ${score.team2} ${match.team2_id.country}\nGoal Scorers:\n${goal_scorers.map(g => `${g.player_name} (${g.team === 'team1' ? match.team1_id.country : match.team2_id.country}, ${g.minute}')`).join('\n')}`
      });
    }

    res.json({ message: 'Match simulated', match });
  } catch (err) {
    console.error('Simulate match error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.playMatch = async (req, res) => {
  const { match_id } = req.body;
  try {
    const match = await Match.findById(match_id).populate('team1_id team2_id');
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const prompt = `Generate football match commentary for ${match.team1_id.country} vs ${match.team2_id.country}. Include key moments, goals, and determine the winner. Squads: ${JSON.stringify(match.team1_id.squad.map(p => ({ name: p.name, position: p.natural_position })))} vs ${JSON.stringify(match.team2_id.squad.map(p => ({ name: p.name, position: p.natural_position })))}.`;
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500
    });

    const commentary = response.choices[0].message.content;
    const score = { team1: Math.floor(Math.random() * 5), team2: Math.floor(Math.random() * 5) };
    const goal_scorers = [];
    for (let i = 0; i < score.team1; i++) {
      const player = match.team1_id.squad[Math.floor(Math.random() * match.team1_id.squad.length)];
      goal_scorers.push({ player_name: player.name, minute: Math.floor(Math.random() * 90) + 1, team: 'team1' });
      player.goals += 1;
    }
    for (let i = 0; i < score.team2; i++) {
      const player = match.team2_id.squad[Math.floor(Math.random() * match.team2_id.squad.length)];
      goal_scorers.push({ player_name: player.name, minute: Math.floor(Math.random() * 90) + 1, team: 'team2' });
      player.goals += 1;
    }

    match.score = score;
    match.goal_scorers = goal_scorers;
    match.type = 'played';
    match.commentary = commentary;
    await match.save();

    await Team.updateOne({ _id: match.team1_id._id }, { squad: match.team1_id.squad });
    await Team.updateOne({ _id: match.team2_id._id }, { squad: match.team2_id.squad });

    const [rep1, rep2] = await Promise.all([
      User.findById(match.team1_id.userId), // Changed from representative_id
      User.findById(match.team2_id.userId)  // Changed from representative_id
    ]);

    if (rep1 && rep2) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: [rep1.email, rep2.email],
        subject: 'Match Result',
        text: `Result: ${match.team1_id.country} ${score.team1} - ${score.team2} ${match.team2_id.country}\nGoal Scorers:\n${goal_scorers.map(g => `${g.player_name} (${g.team === 'team1' ? match.team1_id.country : match.team2_id.country}, ${g.minute}')`).join('\n')}\nCommentary: ${commentary}`
      });
    }

    res.json({ message: 'Match played', match });
  } catch (err) {
    console.error('Play match error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = exports;