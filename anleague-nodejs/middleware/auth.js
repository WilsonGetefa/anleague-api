// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    console.log('No token, redirecting to /login');
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log('User not found for token');
      return res.redirect('/login');
    }

    req.user = user;  // ← SET req.user
    console.log('Authentication successful for path:', req.path, 'User:', user.username);
    next();

  } catch (err) {
    console.error('JWT verification failed:', err.message);
    res.redirect('/login');
  }
};

module.exports = { authMiddleware };