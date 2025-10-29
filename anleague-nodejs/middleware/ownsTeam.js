// middleware/ownsTeam.js
const Team = require('../models/team');

const ownsTeam = async (req, res, next) => {
  try {
    const team = await Team.findOne({ representative_id: req.user._id });
    if (!team) return res.redirect('/dashboard');
    req.team = team;
    next();
  } catch (err) {
    console.error('ownsTeam error:', err);
    res.redirect('/dashboard');
  }
};

module.exports = { ownsTeam };