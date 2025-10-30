// routes/error.js
// routes/error.js
const express = require('express');
const router = express.Router();

// Global error handler (or route)
router.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // PASS USER (from session or JWT)
  const user = req.user || req.session?.user || null;

  res.status(err.status || 500).render('error', {
    title: 'Error',
    error: err.message || 'Something went wrong',
    user: user  // ← THIS WAS MISSING
  });
});

module.exports = router;