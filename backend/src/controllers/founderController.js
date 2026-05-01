const FounderProfile = require('../models/FounderProfile');
const db = require('../config/database');

async function upsertProfile(req, res) {
  try {
    const profile = await FounderProfile.upsert(req.user.id, req.body);
    res.json({ profile });
  } catch (err) {
    console.error('upsertProfile error:', err.message);
    res.status(500).json({ error: 'Failed to save founder profile' });
  }
}
async function getProfile(req, res) {
  try {
    const profile = await FounderProfile.findByUserId(req.user.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    // K-117: include listing_count (listings created by this user)
    try {
      const cr = await db.query('SELECT COUNT(*) AS count FROM listings WHERE provider_id = $1', [req.user.id]);
      profile.listing_count = parseInt(cr.rows[0]?.count, 10) || 0;
    } catch (_) { profile.listing_count = 0; }
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
}
// K-72: Activity feed — new listings matching founder's profile in last 7 days
async function getFeed(req, res) {
  try {
    const profile = await FounderProfile.findByUserId(req.user.id);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Build dynamic query
    let sql = `SELECT * FROM listings WHERE status = 'active' AND created_at > $1`;
    const params = [sevenDaysAgo];

    if (profile?.stage) {
      params.push(profile.stage);
      sql += ` AND (stages IS NULL OR $${params.length} = ANY(stages) OR stages = '{}')`;
    }
    if (profile?.geo) {
      params.push(profile.geo);
      sql += ` AND (geo = $${params.length} OR geo = 'national')`;
    }

    sql += ' ORDER BY created_at DESC LIMIT 10';

    const r = await db.query(sql, params);
    res.json({ listings: r.rows, profile: profile || null });
  } catch (err) {
    console.error('getFeed error:', err);
    res.status(500).json({ error: 'Failed to load feed' });
  }
}

// K-90: Contact history — listings the founder has sent messages about
async function getContactHistory(req, res) {
  try {
    // All messages sent by this founder
    const msgRes = await db.query(
      `SELECT DISTINCT listing_id, MAX(created_at) AS last_contact
         FROM messages
        WHERE sender_id = $1 AND listing_id IS NOT NULL
        GROUP BY listing_id
        ORDER BY last_contact DESC
        LIMIT 20`,
      [req.user.id]
    );
    if (!msgRes.rows.length) return res.json({ contacts: [] });

    // Fetch listing details for each distinct listing_id
    const contacts = [];
    for (const row of msgRes.rows) {
      try {
        const lr = await db.query('SELECT id, title, type, provider_id, status FROM listings WHERE id = $1', [row.listing_id]);
        const listing = lr.rows[0];
        if (listing) contacts.push({ ...listing, last_contact: row.last_contact });
      } catch(_) {}
    }
    res.json({ contacts });
  } catch (e) {
    console.error('getContactHistory error:', e);
    res.status(500).json({ error: 'Failed to load contact history' });
  }
}

module.exports = { upsertProfile, getProfile, getFeed, getContactHistory };
