const Team = require('../models/team');
const User = require('../models/user');

// Mock real-life squad data (replace with API/scrape for bonus)
const mockSquads = {
  Nigeria: [
    { name: 'Victor Osimhen', position: 'AT' },
    { name: 'Ahmed Musa', position: 'AT' },
    // ... 21 more (simplified)
  ],
  // Add other countries
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
  const squad = squadData.map((p, i) => ({
    name: p.name,
    natural_position: p.position,
    ratings: generateRatings(p.position),
    is_captain: i === 0
  }));
  const rating = squad.reduce((sum, p) => sum + p.ratings[p.natural_position], 0) / 23;
  const team = new Team({
    country,
    manager: 'Auto Manager',
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