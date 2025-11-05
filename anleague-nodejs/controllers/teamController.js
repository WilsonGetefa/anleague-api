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

const Team = require('../models/team');
const User = require('../models/user');


const mockSquads = {
  Nigeria: [
    { name: 'Victor Osimhen', position: 'AT' },
    { name: 'Ahmed Musa', position: 'AT' },
    { name: 'Wilfred Ndidi', position: 'MD' },
    { name: 'Kelechi Iheanacho', position: 'AT' },
    { name: 'Alex Iwobi', position: 'MD' },
    { name: 'Samuel Chukwueze', position: 'AT' },
    { name: 'Frank Onyeka', position: 'MD' },
    { name: 'William Troost-Ekong', position: 'DF' },
    { name: 'Leon Balogun', position: 'DF' },
    { name: 'Kenneth Omeruo', position: 'DF' },
    { name: 'Ola Aina', position: 'DF' },
    { name: 'Calvin Bassey', position: 'DF' },
    { name: 'Zaidu Sanusi', position: 'DF' },
    { name: 'Bruno Onyemaechi', position: 'DF' },
    { name: 'Joe Aribo', position: 'MD' },
    { name: 'Raphael Onyedika', position: 'MD' },
    { name: 'Alhassan Yusuf', position: 'MD' },
    { name: 'Victor Boniface', position: 'AT' },
    { name: 'Paul Onuachu', position: 'AT' },
    { name: 'Terem Moffi', position: 'AT' },
    { name: 'Francis Uzoho', position: 'GK' },
    { name: 'Stanley Nwabali', position: 'GK' },
    { name: 'Maduka Okoye', position: 'GK' }
  ],
  Angola: [
    { name: 'Gelson Dala', position: 'AT' },
    { name: 'Mabululu', position: 'AT' },
    { name: 'Fredy', position: 'MD' },
    
  ],
  'Cape Verde': [
    { name: 'Ryan Mendes', position: 'AT' },
    { name: 'Bebé', position: 'AT' },
    { name: 'Jovane Cabral', position: 'MD' },
    
  ],
  'South Africa': [
    { name: 'Percy Tau', position: 'AT' },
    { name: 'Ronwen Williams', position: 'GK' },
    { name: 'Themba Zwane', position: 'MD' },
    
  ],
  Mali: [
    { name: 'Amadou Haidara', position: 'MD' },
    { name: 'Yves Bissouma', position: 'MD' },
    { name: 'Moussa Djenepo', position: 'AT' },
  
  ],
  "Côte d'Ivoire": [
    { name: 'Franck Kessié', position: 'MD' },
    { name: 'Sébastien Haller', position: 'AT' },
    { name: 'Wilfried Zaha', position: 'AT' },
    
  ],
  'DR Congo': [
    { name: 'Chancel Mbemba', position: 'DF' },
    { name: 'Cédric Bakambu', position: 'AT' },
    { name: 'Yoane Wissa', position: 'AT' },
    
  ]
};

function generateRatings(naturalPosition) {
  const positions = ['GK', 'DF', 'MD', 'AT'];
  return positions.reduce((ratings, pos) => {
    ratings[pos] = pos === naturalPosition ? Math.floor(Math.random() * 51) + 50 : Math.floor(Math.random() * 51);
    return ratings;
  }, {});
}

exports.createTeam = async (req, res) => {
  const { country, manager, captain_name, squad } = req.body;
  if (!req.user.country || req.user.country !== country) return res.status(403).json({ error: 'Unauthorized country' });
  if (squad.length !== 23) return res.status(400).json({ error: 'Squad must have 23 players' });

  try {
    const players = squad.map(player => ({
      ...player,
      natural_position: player.natural_position.toUpperCase(),
      ratings: generateRatings(player.natural_position),
      is_captain: player.name === captain_name
    }));
    const rating = players.reduce((sum, p) => sum + p.ratings[p.natural_position], 0) / 23;
    const team = new Team({ country, manager, representative_id: req.user.id, squad: players, captain_name, rating });
    await team.save();
    res.status(201).json({ message: 'Team created' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.autofillTeam = async (req, res) => {
  const { country } = req.body;
  if (!req.user.country || req.user.country !== country) return res.status(403).json({ error: 'Unauthorized' });
  const squadData = mockSquads[country] || Array(23).fill().map((_, i) => ({
    name: `Player${i + 1}`,
    position: ['GK', 'DF', 'MD', 'AT'][Math.floor(Math.random() * 4)]
  }));
  if (squadData.length !== 23) return res.status(400).json({ error: `Squad for ${country} must have 23 players` });
  const squad = squadData.map((p, i) => ({
    name: p.name,
    natural_position: p.position,
    ratings: generateRatings(p.position),
    is_captain: i === 0
  }));
  const rating = squad.reduce((sum, p) => sum + p.ratings[p.natural_position], 0) / 23;
  const team = new Team({
    country,
    manager: `Auto Manager ${country}`,
    representative_id: req.user.id,
    squad,
    captain_name: squad[0].name,
    rating
  });
  try {
    await team.save();
    res.status(201).json({ message: 'Team autofilled' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};