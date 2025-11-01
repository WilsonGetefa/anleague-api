// middleware/adminOnly.js
module.exports = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).render('error', { 
      title: 'Access Denied', 
      message: 'Admin access required.' 
    });
  }
  next();
};