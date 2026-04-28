const db = require('../config/database');

// POST /api/founders/bookmarks  { listing_id }
const saveBookmark = async (req, res) => {
  const { listing_id } = req.body;
  if (!listing_id) return res.status(400).json({ error: 'listing_id required' });
  try {
    // Check listing exists
    const lr = await db.query('SELECT id, title FROM listings WHERE id = $1', [listing_id]);
    if (!lr.rows[0]) return res.status(404).json({ error: 'Listing not found' });
    // Upsert
    const r = await db.query(
      `INSERT INTO saved_listings (user_id, listing_id, saved_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, listing_id) DO NOTHING RETURNING *`,
      [req.user.id, listing_id]
    );
    res.status(201).json({ bookmark: r.rows[0] || { user_id: req.user.id, listing_id }, message: 'Saved' });
  } catch (e) {
    console.error('saveBookmark error:', e);
    res.status(500).json({ error: 'Failed to save bookmark' });
  }
};

// GET /api/founders/bookmarks
const getBookmarks = async (req, res) => {
  try {
    const r = await db.query(
      `SELECT sl.listing_id, sl.saved_at,
              l.title, l.type, l.geo, l.city, l.tags, l.is_premium, l.provider_id, l.status
         FROM saved_listings sl
         JOIN listings l ON l.id = sl.listing_id
        WHERE sl.user_id = $1
        ORDER BY sl.saved_at DESC`,
      [req.user.id]
    );
    res.json({ bookmarks: r.rows });
  } catch (e) {
    console.error('getBookmarks error:', e);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
};

// DELETE /api/founders/bookmarks/:listing_id
const deleteBookmark = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM saved_listings WHERE user_id = $1 AND listing_id = $2',
      [req.user.id, req.params.listing_id]
    );
    res.json({ message: 'Bookmark removed' });
  } catch (e) {
    console.error('deleteBookmark error:', e);
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
};

module.exports = { saveBookmark, getBookmarks, deleteBookmark };
