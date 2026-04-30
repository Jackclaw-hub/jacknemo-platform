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

module.exports = { upsertProfile, getProfile, getFeed };
