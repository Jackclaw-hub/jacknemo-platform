const db = require('../config/database');

const submitRating = async (req, res) => {
  try {
    const { rating, comment, listing_id } = req.body;
    const providerId = req.params.userId;
    const founderId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const result = await db.query(
      `INSERT INTO provider_ratings (provider_id, founder_id, listing_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (provider_id, founder_id) DO UPDATE SET rating=$4, comment=$5, created_at=NOW()
       RETURNING *`,
      [providerId, founderId, listing_id || null, rating, comment || null]
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

// K-166: GET /providers/:userId/ratings — individual reviews with average
const getRatings = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT pr.id, pr.rating, pr.comment, pr.created_at,
              u.name AS founder_name
         FROM provider_ratings pr
         LEFT JOIN users u ON u.id = pr.founder_id
        WHERE pr.provider_id = $1
        ORDER BY pr.created_at DESC
        LIMIT 50`,
      [req.params.userId]
    );
    const ratings = result.rows;
    const avg = ratings.length
      ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
      : 0;
    res.json({
      ratings,
      average: Math.round(avg * 10) / 10,
      count: ratings.length,
    });
  } catch (err) {
    console.error('getRatings error:', err);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
};

module.exports = { submitRating, getRating, getRatings };
