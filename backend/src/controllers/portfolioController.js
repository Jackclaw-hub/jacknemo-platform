// K-184: Provider portfolio / case study section
const pool = require('../config/database');
const MAX_ENTRIES = 5;

// GET /api/providers/:userId/portfolio — public
const getPortfolio = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT id, title, description, image_url, link, position, created_at FROM provider_portfolio WHERE provider_id = $1 ORDER BY position ASC, created_at ASC',
      [userId]
    );
    res.json({ portfolio: result.rows });
  } catch (err) {
    console.error('getPortfolio error:', err);
    res.status(500).json({ error: 'Could not fetch portfolio' });
  }
};

// POST /api/providers/portfolio — authenticated provider
const addPortfolioEntry = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { title, description, image_url, link, position = 0 } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    if (title.length > 120) return res.status(400).json({ error: 'title too long (max 120)' });

    // Enforce max 5 entries
    const count = await pool.query('SELECT COUNT(*) FROM provider_portfolio WHERE provider_id = $1', [providerId]);
    if (parseInt(count.rows[0].count) >= MAX_ENTRIES) {
      return res.status(400).json({ error: 'Maximum 5 portfolio entries allowed' });
    }

    const result = await pool.query(
      'INSERT INTO provider_portfolio (provider_id, title, description, image_url, link, position) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [providerId, title, description || null, image_url || null, link || null, position]
    );
    res.status(201).json({ entry: result.rows[0] });
  } catch (err) {
    console.error('addPortfolioEntry error:', err);
    res.status(500).json({ error: 'Could not add portfolio entry' });
  }
};

// PUT /api/providers/portfolio/:id — authenticated provider (own entries only)
const updatePortfolioEntry = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { id } = req.params;
    const { title, description, image_url, link, position } = req.body;

    const existing = await pool.query('SELECT id FROM provider_portfolio WHERE id = $1 AND provider_id = $2', [id, providerId]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Entry not found' });

    const fields = [];
    const vals = [];
    let n = 1;
    if (title !== undefined) { fields.push('title = $' + n++); vals.push(title); }
    if (description !== undefined) { fields.push('description = $' + n++); vals.push(description); }
    if (image_url !== undefined) { fields.push('image_url = $' + n++); vals.push(image_url); }
    if (link !== undefined) { fields.push('link = $' + n++); vals.push(link); }
    if (position !== undefined) { fields.push('position = $' + n++); vals.push(position); }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    vals.push(id);
    const result = await pool.query(
      'UPDATE provider_portfolio SET ' + fields.join(', ') + ' WHERE id = $' + n + ' RETURNING *',
      vals
    );
    res.json({ entry: result.rows[0] });
  } catch (err) {
    console.error('updatePortfolioEntry error:', err);
    res.status(500).json({ error: 'Could not update entry' });
  }
};

// DELETE /api/providers/portfolio/:id — authenticated provider (own entries only)
const deletePortfolioEntry = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM provider_portfolio WHERE id = $1 AND provider_id = $2 RETURNING id',
      [id, providerId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Entry not found' });
    res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) {
    console.error('deletePortfolioEntry error:', err);
    res.status(500).json({ error: 'Could not delete entry' });
  }
};

module.exports = { getPortfolio, addPortfolioEntry, updatePortfolioEntry, deletePortfolioEntry };
