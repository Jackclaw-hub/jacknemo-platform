const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// POST /api/listings/:id/rent — create rental request
router.post('/listings/:id/rent', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, message } = req.body;
    const renter_id = req.user.id;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }
    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ error: 'end_date must be after start_date' });
    }

    // Get listing to find provider
    const listing = await pool.query(
      'SELECT id, provider_id, rental_available FROM listings WHERE id = $1',
      [id]
    );
    if (!listing.rows.length) return res.status(404).json({ error: 'Listing not found' });
    if (!listing.rows[0].rental_available) {
      return res.status(400).json({ error: 'This listing is not available for rental' });
    }

    const provider_id = listing.rows[0].provider_id;
    if (provider_id === renter_id) {
      return res.status(400).json({ error: 'Cannot rent your own listing' });
    }

    const result = await pool.query(
      `INSERT INTO rentals (listing_id, renter_id, provider_id, start_date, end_date, message)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, renter_id, provider_id, start_date, end_date, message || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /rent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/rentals/me — renter sees their requests
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, l.title as listing_title, l.rental_price_per_day,
              u.email as provider_email
       FROM rentals r
       JOIN listings l ON r.listing_id = l.id
       JOIN users u ON r.provider_id = u.id
       WHERE r.renter_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /rentals/me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/rentals/provider — provider sees incoming requests
router.get('/provider', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, l.title as listing_title,
              u.email as renter_email
       FROM rentals r
       JOIN listings l ON r.listing_id = l.id
       JOIN users u ON r.renter_id = u.id
       WHERE r.provider_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /rentals/provider error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/rentals/:id/status — provider approves/rejects
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['approved', 'rejected', 'returned'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const rental = await pool.query('SELECT * FROM rentals WHERE id = $1', [id]);
    if (!rental.rows.length) return res.status(404).json({ error: 'Rental not found' });
    if (rental.rows[0].provider_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { rows } = await pool.query(
      'UPDATE rentals SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /rentals/:id/status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
