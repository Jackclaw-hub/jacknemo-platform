// K-68: Quick-reply message templates
const db = require('../config/database');

const MAX_TEMPLATES = 20;

// GET /api/providers/templates — list own templates
const getTemplates = async (req, res) => {
  try {
    const r = await db.query(
      'SELECT id, name, body, created_at FROM message_templates WHERE user_id = $1 ORDER BY created_at ASC',
      [req.user.id]
    );
    res.json({ templates: r.rows });
  } catch (e) {
    console.error('getTemplates error:', e);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

// POST /api/providers/templates — create a new template
const createTemplate = async (req, res) => {
  const { name, body } = req.body;
  if (!name || !body) return res.status(400).json({ error: 'name and body are required' });
  if (name.length > 80) return res.status(400).json({ error: 'name too long (max 80 chars)' });
  if (body.length > 1000) return res.status(400).json({ error: 'body too long (max 1000 chars)' });
  try {
    // Enforce per-user cap
    const count = await db.query(
      'SELECT COUNT(*) FROM message_templates WHERE user_id = $1',
      [req.user.id]
    );
    if (parseInt(count.rows[0].count, 10) >= MAX_TEMPLATES) {
      return res.status(400).json({ error: `Maximum ${MAX_TEMPLATES} templates allowed` });
    }
    const r = await db.query(
      `INSERT INTO message_templates (user_id, name, body, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [req.user.id, name.trim(), body.trim()]
    );
    res.status(201).json({ template: r.rows[0] });
  } catch (e) {
    console.error('createTemplate error:', e);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

// DELETE /api/providers/templates/:id — delete own template
const deleteTemplate = async (req, res) => {
  try {
    const r = await db.query(
      'DELETE FROM message_templates WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Template not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('deleteTemplate error:', e);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};

module.exports = { getTemplates, createTemplate, deleteTemplate };
