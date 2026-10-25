const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('styleguide', {
    hasReviews: false,
    seo: { title: 'Style guide | Yannick Scents', noindex: true, stylesheet: 'styleguide.css' },
  });
});

module.exports = router;
