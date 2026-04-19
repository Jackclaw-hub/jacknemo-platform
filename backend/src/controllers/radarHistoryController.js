const db = require('../config/database');

// POST /api/radar/history — log a match action
const addHistory = async (req, res) => {
  try {
    const { listing_id, score, action = 'viewed' } = req.body;
    if (!listing_id) return res.status(400).json({ error: 'listing_id required' });
    await db.query(
      `INSERT INTO founder_match_history (founder_id, listing_id, score, action)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (founder_id, listing_id, action) DO UPDATE SET created_at=NOW()`,
      [req.user.id, listing_id, score || null, action]
    );
    res.json({ ok: true });
  } catch(err) {
    console.error('addHistory error:', err.message);
    res.status(500).json({ error: 'Failed to save history' });
  }
};

// GET /api/radar/history — get founder match history
const getHistory = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT fmh.*, l.title, l.type, l.city, l.geo, l.tags, l.view_count, l.contact_count
       FROM founder_match_history fmh
       JOIN listings l ON l.id = fmh.listing_id
       WHERE fmh.founder_id = $1
       ORDER BY fmh.created_at DESC
       LIMIT 100`,
      [req.user.id]
    );
    res.json({ history: result.rows, count: result.rows.length });
  } catch(err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

module.exports = { addHistory, getHistory };
