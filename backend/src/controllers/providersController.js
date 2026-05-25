const getMyStats = async (req, res) => {
  try {
    const db = require('../config/database');
    const { rows } = await db.query('SELECT l.id, l.title, COALESCE(l.contact_count,0) as contact_count, COALESCE(l.view_count,0) as view_count, COUNT(DISTINCT m.id)::int as message_count FROM listings l LEFT JOIN messages m ON m.listing_id=l.id WHERE l.provider_id=$1 GROUP BY l.id,l.title,l.contact_count,l.view_count ORDER BY l.id', [req.user.id]);
    res.json({ stats: rows });
  } catch(e){ res.status(500).json({error:e.message}); }
};

module.exports = {
  getMyStats
};