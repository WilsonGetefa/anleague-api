const Match = require('../models/match');
const Team = require('../models/team');
const Tournament = require('../models/tournament');
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
      const player = match.team1_id.squad[Math.floor(Math.random() * 23)];
      goal_scorers.push({ player_name: player.name, minute: Math.floor(Math.random() * 90) + 1, team: 'team1' });
    }
    for (let i = 0; i < score.team2; i++) {
      const player = match.team2_id.squad[Math.floor(Math.random() * 23)];
      goal_scorers.push({ player_name: player.name, minute: Math.floor(Math.random() * 90) + 1, team: 'team2' });
    }

    match.score = score;
    match.goal_scorers = goal_scorers;
    match.type = 'simulated';
    await match.save();

    // Email representatives
    const [rep1, rep2] = await Promise.all([
      User.findById(match.team1_id.representative_id),
      User.findById(match.team2_id.representative_id)
    ]);
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: [rep1.email, rep2.email],
      subject: 'Match Result',
      text: `Result: ${match.team1_id.country} ${score.team1} - ${score.team2} ${match.team2_id.country}`
    });

    res.json({ message: 'Match simulated', match });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.playMatch = async (req, res) => {
  const { match_id } = req.body;
  try {
    const match = await Match.findById(match_id).populate('team1_id team2_id');
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const prompt = `Generate football match commentary for ${match.team1_id.country} vs ${match.team2_id.country} using squads: ${JSON.stringify(match.team1_id.squad)} vs ${JSON.stringify(match.team2_id.squad)}. Include key moments, goals, until winner.`;
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    });

    // Parse AI response for score and goals (simplified)
    const commentary = response.choices[0].message.content;
    const score = { team1: Math.floor(Math.random() * 5), team2: Math.floor(Math.random() * 5) }; // Mock parsing
    const goal_scorers = []; // Parse from commentary or mock as above

    match.score = score;
    match.goal_scorers = goal_scorers;
    match.type = 'played';
    match.commentary = commentary;
    await match.save();

    // Email representatives
    const [rep1, rep2] = await Promise.all([
      User.findById(match.team1_id.representative_id),
      User.findById(match.team2_id.representative_id)
    ]);
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: [rep1.email, rep2.email],
      subject: 'Match Result',
      text: `Result: ${match.team1_id.country} ${score.team1} - ${score.team2} ${match.team2_id.country}\nCommentary: ${commentary}`
    });

    res.json({ message: 'Match played', match });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};