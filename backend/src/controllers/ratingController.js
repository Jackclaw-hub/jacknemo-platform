const db = require('../config/database');

const submitRating = async (req, res) => {
  try {
    const { rating, listing_id } = req.body;
    const providerId = req.params.userId;
    const founderId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify founder has contacted this provider (listing must exist in their history)
    const histCheck = await db.query(
      `SELECT id FROM founder_match_history WHERE user_id=$1 AND listing_id=$2 AND action='contact'`,
      [founderId, listing_id]
    );
    if (!histCheck.rows.length) {
      return res.status(403).json({ error: 'You must contact a listing before rating the provider' });
    }

    const result = await db.query(
      `INSERT INTO provider_ratings (provider_id, founder_id, listing_id, rating)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (provider_id, founder_id) DO UPDATE SET rating=$4, created_at=NOW()
       RETURNING *`,
      [providerId, founderId, listing_id || null, rating]
    );
    res.json({ rating: result.rows[0] });
  } catch (err) {
    console.error('submitRating error:', err);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};

const getRating = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) as count, ROUND(AVG(rating)::numeric,1) as average
       FROM provider_ratings WHERE provider_id=$1`,
      [req.params.userId]
    );
    const row = result.rows[0];
    res.json({
      average: parseFloat(row.average) || 0,
      count: parseInt(row.count) || 0,
    });
  } catch (err) {
    console.error('getRating error:', err);
    res.status(500).json({ error: 'Failed to fetch rating' });
  }
};

module.exports = { submitRating, getRating };
