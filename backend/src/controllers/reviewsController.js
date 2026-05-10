const pool = require('../db'); // Assuming you have a db.js for PostgreSQL connection
const authenticateToken = require('../middleware/authenticateToken'); // Assuming auth middleware

// Submit or update a review
const submitReview = async (req, res) => {
  const { id: listing_id } = req.params;
  const { rating, comment } = req.body;
  const reviewer_id = req.user.id; // Assuming user ID is available from authentication

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO listing_reviews (listing_id, reviewer_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (listing_id, reviewer_id) DO UPDATE SET
         rating = EXCLUDED.rating,
         comment = EXCLUDED.comment,
         created_at = NOW()
       RETURNING *;`,
      [listing_id, reviewer_id, rating, comment]
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get reviews for a listing
const getReviews = async (req, res) => {
  const { id: listing_id } = req.params;

  try {
    const reviewsResult = await pool.query(
      `SELECT lr.*, u.username FROM listing_reviews lr
       JOIN users u ON lr.reviewer_id = u.id
       WHERE listing_id = $1
       ORDER BY created_at DESC;`,
      [listing_id]
    );

    const avgRatingResult = await pool.query(
      `SELECT AVG(rating)::numeric(10,1) as avg_rating, COUNT(id) as total_reviews
       FROM listing_reviews
       WHERE listing_id = $1;`,
      [listing_id]
    );

    const { avg_rating, total_reviews } = avgRatingResult.rows[0];

    res.status(200).json({
      avg_rating: avg_rating || 0,
      total_reviews: total_reviews || 0,
      reviews: reviewsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  submitReview,
  getReviews,
};