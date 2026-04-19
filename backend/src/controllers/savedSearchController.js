const db = require('../config/database');

const saveSearch = async (req, res) => {
  try {
    const { name, filters } = req.body;
    if (!filters || typeof filters !== 'object') {
      return res.status(400).json({ error: 'filters object required' });
    }
    const result = await db.query(
      `INSERT INTO saved_searches (user_id, name, filters)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, name || 'My Search', JSON.stringify(filters)]
    );
    res.status(201).json({ savedSearch: result.rows[0] });
  } catch (err) {
    console.error('saveSearch error:', err);
    res.status(500).json({ error: 'Failed to save search' });
  }
};

const getSavedSearches = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM saved_searches WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ savedSearches: result.rows });
  } catch (err) {
    console.error('getSavedSearches error:', err);
    res.status(500).json({ error: 'Failed to fetch saved searches' });
  }
};

const deleteSavedSearch = async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM saved_searches WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) {
    console.error('deleteSavedSearch error:', err);
    res.status(500).json({ error: 'Failed to delete saved search' });
  }
};

module.exports = { saveSearch, getSavedSearches, deleteSavedSearch };
