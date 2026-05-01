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

// K-144: Private founder notes per listing
const upsertNote = async (req, res) => {
  try {
    const { note } = req.body;
    if (typeof note !== 'string') return res.status(400).json({ error: 'note must be a string' });
    const r = await db.query(
      `INSERT INTO founder_notes (listing_id, founder_id, note, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (listing_id, founder_id) DO UPDATE SET note = $3, updated_at = NOW()
       RETURNING *`,
      [req.params.id, req.user.id, note]
    );
    res.json({ note: r.rows[0] });
  } catch (err) {
    console.error('upsertNote error:', err);
    res.status(500).json({ error: 'Failed to save note' });
  }
};

const getNote = async (req, res) => {
  try {
    const r = await db.query(
      'SELECT * FROM founder_notes WHERE listing_id = $1 AND founder_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ note: r.rows[0] || null });
  } catch (err) {
    console.error('getNote error:', err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
};

// K-161: Record a listing as recently viewed by this founder
const recordRecentView = async (req, res) => {
  const { listing_id, title, type } = req.body;
  if (!listing_id) return res.status(400).json({ error: 'listing_id required' });
  try {
    await db.query(
      `INSERT INTO founder_recent_views (founder_id, listing_id, title, type, viewed_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (founder_id, listing_id) DO UPDATE SET viewed_at = NOW(), title = $3, type = $4`,
      [req.user.id, listing_id, title || null, type || null]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('recordRecentView error:', err);
    res.status(500).json({ error: 'Failed to record view' });
  }
};

// K-161: Get last 10 recently viewed listings for this founder
const getRecentViews = async (req, res) => {
  try {
    const r = await db.query(
      `SELECT listing_id AS id, title, type, viewed_at
         FROM founder_recent_views
        WHERE founder_id = $1
        ORDER BY viewed_at DESC
        LIMIT 10`,
      [req.user.id]
    );
    res.json({ recent: r.rows });
  } catch (err) {
    console.error('getRecentViews error:', err);
    res.status(500).json({ error: 'Failed to fetch recent views' });
  }
};

module.exports = { upsertProfile, getProfile, getFeed, getContactHistory, upsertNote, getNote, recordRecentView, getRecentViews };
