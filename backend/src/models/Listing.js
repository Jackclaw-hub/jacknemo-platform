// Use mock database (PG credentials pending from Ahmad)
const pool = require('../config/database-mock');

class Listing {
  static async create(data) {
    const { 
      type, title, description, providerId, providerRole, geo, city,
      tags, stages, sectors, starterFriendly, hourlyRate, dailyRate, fromPrice, status
    } = data;

    const query = `
      INSERT INTO listings 
        (type, title, description, provider_id, provider_role, geo, city,
         tags, stages, sectors, starter_friendly, hourly_rate, daily_rate, from_price, status, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      type, title, description, providerId, providerRole, geo, city || null,
      JSON.stringify(tags || []), JSON.stringify(stages || []), JSON.stringify(sectors || []),
      starterFriendly || false, hourlyRate || null, dailyRate || null, fromPrice || null,
      status || 'pending'
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll({ type, geo, starterFriendly, status = 'active' } = {}) {
    let query = 'SELECT * FROM listings WHERE status = $1';
    const values = [status];
    let idx = 2;
    if (type) { query += ` AND type = $${idx++}`; values.push(type); }
    if (geo) { query += ` AND geo = $${idx++}`; values.push(geo); }
    if (starterFriendly === true) { query += ` AND starter_friendly = $${idx++}`; values.push(true); }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByProvider(providerId) {
    const result = await pool.query(
      'SELECT * FROM listings WHERE provider_id = $1 ORDER BY created_at DESC', [providerId]
    );
    return result.rows;
  }

  static async update(id, providerId, data) {
    const allowed = ['title','description','geo','city','tags','stages','sectors',
                     'starter_friendly','hourly_rate','daily_rate','from_price'];
    const sets = [];
    const values = [];
    let idx = 1;
    for (const [key, val] of Object.entries(data)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) {
        sets.push(`${col} = $${idx++}`);
        values.push(Array.isArray(val) ? JSON.stringify(val) : val);
      }
    }
    if (!sets.length) return null;
    sets.push(`updated_at = NOW()`);
    values.push(id, providerId);
    const query = `UPDATE listings SET ${sets.join(', ')} 
                   WHERE id = $${idx++} AND provider_id = $${idx++} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id, providerId) {
    const result = await pool.query(
      'DELETE FROM listings WHERE id = $1 AND provider_id = $2 RETURNING id', [id, providerId]
    );
    return result.rows[0] || null;
  }
}

module.exports = Listing;
