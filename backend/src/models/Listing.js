const pool = require("../config/database");

class Listing {
  static async create(data) {
    const {
      type, title, description, providerId, providerRole, geo, city,
      tags, stages, sectors, starterFriendly, hourlyRate, dailyRate, fromPrice, status, imageUrl
    } = data;

    const query = `
      INSERT INTO listings
        (type, title, description, provider_id, provider_role, geo, city,
         tags, stages, sectors, starter_friendly, hourly_rate, daily_rate, from_price, status, image_url,
         expires_at, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, NOW() + INTERVAL '90 days', NOW(), NOW())
      RETURNING *
    `;
    const values = [
      type, title, description, providerId, providerRole, geo, city || null,
      JSON.stringify(tags || []), JSON.stringify(stages || []), JSON.stringify(sectors || []),
      starterFriendly || false, hourlyRate || null, dailyRate || null, fromPrice || null,
      status || 'pending', imageUrl || null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll({ type, geo, starterFriendly, tags, stage, city, status = 'active', min_budget, max_budget, industry, location, available_from } = {}) {
    let query = 'SELECT * FROM listings WHERE status = $1';
    const values = [status];
    let idx = 2;
    if (type) { query += ` AND type = $${idx++}`; values.push(type); }
    if (geo)  { query += ` AND geo = $${idx++}`;  values.push(geo); }
    if (starterFriendly === true) { query += ` AND starter_friendly = $${idx++}`; values.push(true); }
    // K-168: stage filter — JSONB array contains value
    if (stage) { query += ` AND stages::jsonb @> $${idx++}::jsonb`; values.push(JSON.stringify([stage])); }
    // K-168: city filter — case-insensitive substring
    if (city)  { query += ` AND LOWER(city) LIKE $${idx++}`; values.push('%' + city.toLowerCase() + '%'); }
    // K-192: New filters
    if (min_budget) { query += ` AND hourly_rate >= $${idx++}`; values.push(min_budget); }
    if (max_budget) { query += ` AND hourly_rate <= $${idx++}`; values.push(max_budget); }
    if (industry) { query += ` AND LOWER(sectors::text) LIKE $${idx++}`; values.push('%' + industry.toLowerCase() + '%'); }
    if (location) { query += ` AND LOWER(city) LIKE $${idx++}`; values.push('%' + location.toLowerCase() + '%'); }
    // available_from is ignored as per instruction if column doesn't exist, which we assume due to psql not found
    // if (available_from) { query += ` AND available_from <= $${idx++}`; values.push(available_from); }
    // tags: comma-separated string or array — filter in-memory after query (mock + PG compatible)
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, values);
    let rows = result.rows;
    // Tag filter (works with both JSON array stored as string and real array)
    if (tags) {
      const filterTags = (Array.isArray(tags) ? tags : tags.split(',')).map(t => t.trim().toLowerCase()).filter(Boolean);
      if (filterTags.length) {
        rows = rows.filter(l => {
          const lTags = Array.isArray(l.tags) ? l.tags : (typeof l.tags === 'string' ? JSON.parse(l.tags || '[]') : []);
          return filterTags.some(ft => lTags.some(lt => lt.toLowerCase().includes(ft)));
        });
      }
    }
    return rows;
  }

  static async search(term) {
    // K-162: relevance scoring — title=3, tags=2 each, description=1; sort by score DESC then created_at DESC
    const like = `%${term.toLowerCase()}%`;
    const result = await pool.query(
      `SELECT *,
          (CASE WHEN LOWER(title) LIKE $1 THEN 3 ELSE 0 END
         + CASE WHEN LOWER(tags::text) LIKE $1 THEN 2 ELSE 0 END
         + CASE WHEN LOWER(description) LIKE $1 THEN 1 ELSE 0 END
          ) AS relevance_score
       FROM listings
       WHERE status = 'active' AND (
         LOWER(title) LIKE $1 OR LOWER(description) LIKE $1 OR LOWER(tags::text) LIKE $1
       )
       ORDER BY relevance_score DESC, created_at DESC`,
      [like]
    );
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
                     'starter_friendly','hourly_rate','daily_rate','from_price','image_url'];
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

  static async updateStatus(id, status, rejectionReason = null) {
    const query = rejectionReason
      ? "UPDATE listings SET status = $1, description = description || $2, updated_at = NOW() WHERE id = $3 RETURNING *"
      : "UPDATE listings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *";
    const values = rejectionReason ? [status, ` [REJECTED: ${rejectionReason}]`, id] : [status, id];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async setFeatured(id, featured) {
    const result = await pool.query(
      "UPDATE listings SET featured = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [featured, id]
    );
    return result.rows[0] || null;
  }

  static async incrementView(id) {
    await pool.query(
      "UPDATE listings SET view_count = COALESCE(view_count,0) + 1 WHERE id = $1",
      [id]
    );
  }


  static async setPremium(id, isPremium, durationDays = 30) {
    const expiresAt = isPremium
      ? new Date(Date.now() + durationDays * 86400000).toISOString()
      : null;
    const result = await pool.query(
      "UPDATE listings SET is_premium = $1, premium_expires_at = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [isPremium, expiresAt, id]
    );
    return result.rows[0] || null;
  }
  static async incrementContact(id) {
    await pool.query(
      "UPDATE listings SET contact_count = COALESCE(contact_count,0) + 1 WHERE id = $1",
      [id]
    );
  }

  // K-56: Renew listing — extends expiry 90 days and reactivates if expired
  static async renew(id, providerId) {
    const result = await pool.query(
      "UPDATE listings SET status='active', expires_at = NOW() + INTERVAL '90 days', updated_at = NOW() WHERE id = $1 AND provider_id = $2 AND status IN ('active','expired') RETURNING *",
      [id, providerId]
    );
    return result.rows[0] || null;
  }

  // K-73: Duplicate a listing as a new draft owned by the same provider
  static async duplicate(id, providerId) {
    const original = await pool.query('SELECT * FROM listings WHERE id = $1 AND provider_id = $2', [id, providerId]);
    if (!original.rows[0]) return null;
    const o = original.rows[0];
    const result = await pool.query(
      `INSERT INTO listings
         (type, title, description, provider_id, provider_role, geo, city,
          tags, stages, sectors, starter_friendly, hourly_rate, daily_rate, from_price,
          image_url, status, expires_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'draft',
               NOW() + INTERVAL '90 days', NOW(), NOW())
       RETURNING *`,
      [
        o.type, 'Kopie von ' + o.title, o.description, o.provider_id, o.provider_role,
        o.geo, o.city, o.tags, o.stages, o.sectors, o.starter_friendly,
        o.hourly_rate, o.daily_rate, o.from_price, o.image_url
      ]
    );
    return result.rows[0];
  }

  // K-56: Expire listings older than 90 days — called by admin cron endpoint
  static async expireOldListings() {
    const result = await pool.query(
      "UPDATE listings SET status='expired', updated_at = NOW() WHERE status = 'active' AND expires_at < NOW() RETURNING id"
    );
    return result.rows.map(r => r.id);
  }
}

module.exports = Listing;
