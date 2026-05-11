const express = require('express');
const router = express.Router();
const db = require('../db'); // adjust path if needed

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`SELECT unnest(tags) as tag, COUNT(*) as n FROM listings GROUP BY tag ORDER BY n DESC LIMIT 20`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to fetch tags'});
  }
});

module.exports = router;
