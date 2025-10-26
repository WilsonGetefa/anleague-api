const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  if (!req.user) {
    console.log('Authentication failed for path:', req.path, 'req.user:', req.user, 'Cookies:', req.cookies);
    return res.redirect('/login');
  }
  console.log('Authentication successful for path:', req.path, 'User:', req.user.username);
  next();
};

module.exports = { authMiddleware };