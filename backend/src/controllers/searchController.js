const db = require('../config/database');

// GET /api/listings/search?q=...&type=...&city=...&geo=...
const searchListings = async (req, res) => {
  try {
    const { q, type, city, geo, limit = 20 } = req.query;
    
    let whereClauses = ["status IN ('approved','active')"];
    const params = [];
    let idx = 1;

    if (q && q.trim()) {
      // tags is jsonb — cast to text for search
      whereClauses.push(
        `to_tsvector('german', COALESCE(title,'') || ' ' || COALESCE(description,'') || ' ' || COALESCE(tags::text,''))
         @@ plainto_tsquery('german', $${idx})`
      );
      params.push(q.trim());
      idx++;
    }
    if (type) { whereClauses.push(`type = $${idx}`); params.push(type); idx++; }
    if (city) { whereClauses.push(`LOWER(city) LIKE $${idx}`); params.push('%' + city.toLowerCase() + '%'); idx++; }
    if (geo)  { whereClauses.push(`geo = $${idx}`); params.push(geo); idx++; }

    params.push(Math.min(parseInt(limit) || 20, 100));
    const sql = `SELECT id, title, type, geo, city, tags, description, view_count, contact_count, status, created_at
                 FROM listings
                 WHERE ${whereClauses.join(' AND ')}
                 ORDER BY created_at DESC
                 LIMIT $${idx}`;

    const result = await db.query(sql, params);
    res.json({ listings: result.rows, count: result.rows.length, query: q });
  } catch(err) {
    console.error('searchListings error:', err.message);
    res.status(500).json({ error: 'Search failed', detail: err.message });
  }
};

module.exports = { searchListings };
