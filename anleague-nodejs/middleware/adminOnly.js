// middleware/adminOnly.js
module.exports = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).render('error', { message: 'Access denied.' });
  }
  next();
};