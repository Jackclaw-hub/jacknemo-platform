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

// K-158: GET /api/founders/collections
const getCollections = async (req, res) => {
  try {
    const r = await db.query(
      'SELECT id, name, created_at FROM bookmark_collections WHERE user_id = $1 ORDER BY created_at ASC',
      [req.user.id]
    );
    res.json({ collections: r.rows });
  } catch (e) {
    console.error('getCollections error:', e);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
};

// K-158: POST /api/founders/collections  { name }
const createCollection = async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name required' });
  if (name.length > 60) return res.status(400).json({ error: 'name too long (max 60)' });
  try {
    const r = await db.query(
      'INSERT INTO bookmark_collections (user_id, name, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [req.user.id, name.trim()]
    );
    res.status(201).json({ collection: r.rows[0] });
  } catch (e) {
    console.error('createCollection error:', e);
    res.status(500).json({ error: 'Failed to create collection' });
  }
};

// K-158: PATCH /api/founders/bookmarks/:listing_id/collection  { collection_id }
const assignCollection = async (req, res) => {
  const { collection_id } = req.body;
  try {
    const r = await db.query(
      'UPDATE saved_listings SET collection_id = $1 WHERE user_id = $2 AND listing_id = $3 RETURNING *',
      [collection_id || null, req.user.id, req.params.listing_id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Bookmark not found' });
    res.json({ bookmark: r.rows[0] });
  } catch (e) {
    console.error('assignCollection error:', e);
    res.status(500).json({ error: 'Failed to assign collection' });
  }
};

module.exports = { saveBookmark, getBookmarks, deleteBookmark, getCollections, createCollection, assignCollection };
