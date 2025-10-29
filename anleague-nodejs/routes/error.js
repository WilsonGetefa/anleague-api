// routes/error.js
const express = require('express');
const router = express.Router();

router.get('/error', (req, res) => {
  const error = req.query.error || 'An unexpected error occurred.';
  res.render('error', { 
    title: 'Error - ANL', 
    error 
  });
});

module.exports = router;