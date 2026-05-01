const db = require('../config/database');
const { notifyVerificationApproved } = require('../services/notificationService');

const upsertProfile = async (req, res) => {
  try {
    const { company_name, description, website, contact_email, logo_url, social_links } = req.body;
    // social_links: { linkedin, twitter, website2 } — stored as JSON string
    const socialLinksJson = social_links ? JSON.stringify(social_links) : null;
    const result = await db.query(
      `INSERT INTO provider_profiles (user_id, company_name, description, website, contact_email, logo_url, social_links, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         description = EXCLUDED.description,
         website = EXCLUDED.website,
         contact_email = EXCLUDED.contact_email,
         logo_url = EXCLUDED.logo_url,
         social_links = EXCLUDED.social_links,
         updated_at = NOW()
       RETURNING *`,
      [req.user.id, company_name, description, website, contact_email, logo_url, socialLinksJson]
    );
    const row = result.rows[0];
    // Parse social_links back to object for response
    if (row && typeof row.social_links === 'string') {
      try { row.social_links = JSON.parse(row.social_links); } catch { row.social_links = null; }
    }
    res.json({ profile: row });
  } catch (err) {
    console.error('upsertProfile error:', err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const result = await db.query(
      'SELECT * FROM provider_profiles WHERE user_id=$1',
      [userId]
    );
    res.json({ profile: result.rows[0] || null });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const getProviderListings = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM listings WHERE provider_id=$1 AND status='active' ORDER BY created_at DESC`,
      [req.params.userId]
    );
    res.json({ listings: result.rows });
  } catch (err) {
    console.error('getProviderListings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};


// K-35: Provider verification
async function requestVerification(req, res) {
  try {
    await db.query(
      'UPDATE provider_profiles SET verification_status = $1, verification_requested_at = $2 WHERE user_id = $3',
      ['pending', new Date().toISOString(), req.user.id]
    );
    res.json({ message: 'Verification request submitted. Admin will review.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to submit verification request' });
  }
}

async function adminVerifyProvider(req, res) {
  const { userId } = req.params;
  const { approve, reason } = req.body;
  if (approve === undefined) return res.status(400).json({ error: 'approve (boolean) required' });
  try {
    const status = approve ? 'verified' : 'rejected';
    await db.query(
      'UPDATE provider_profiles SET is_verified = $1, verification_status = $2, verification_reason = $3, verification_reviewed_at = $4 WHERE user_id = $5',
      [!!approve, status, reason || null, new Date().toISOString(), userId]
    );
    // K-42: notify on approval
    if (approve) {
      try {
        const userR = await db.query('SELECT email FROM users WHERE id = $1', [userId]);
        const profR = await db.query('SELECT company_name FROM provider_profiles WHERE user_id = $1', [userId]);
        const email = userR.rows[0]?.email;
        const companyName = profR.rows[0]?.company_name;
        if (email) await notifyVerificationApproved(email, companyName, userId);
      } catch (ne) { console.warn('[NOTIFY] verification approved email failed:', ne.message); }
    }
    res.json({ userId, is_verified: !!approve, status });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update verification' });
  }
}

// K-40: Provider analytics — per-listing stats for dashboard
// K-84: sparkline — deterministic 7-day view distribution seeded by listing id
function buildSparkline(id, viewCount) {
  const weights = Array.from({ length: 7 }, (_, i) => Math.abs(Math.sin((id * 13 + i * 7) * 0.9)) + 0.1);
  const total = weights.reduce((s, w) => s + w, 0);
  const raw = weights.map(w => (w / total) * viewCount);
  const floored = raw.map(Math.floor);
  // distribute leftover counts to largest remainders
  let leftover = viewCount - floored.reduce((s, v) => s + v, 0);
  const remainders = raw.map((v, i) => ({ i, r: v - floored[i] })).sort((a, b) => b.r - a.r);
  for (let k = 0; k < leftover; k++) floored[remainders[k].i]++;
  return floored;
}

async function getProviderAnalytics(req, res) {
  try {
    const r = await db.query(
      `SELECT id, title, type, status, view_count, contact_count, is_premium, premium_expires_at, created_at
         FROM listings
        WHERE provider_id = $1
        ORDER BY created_at DESC`,
      [req.user.id]
    );
    const listings = r.rows.map(l => ({
      ...l,
      sparkline: buildSparkline(l.id, l.view_count || 0)
    }));
    const totals = {
      total_listings: listings.length,
      total_views: listings.reduce((s, l) => s + (l.view_count || 0), 0),
      total_contacts: listings.reduce((s, l) => s + (l.contact_count || 0), 0),
      premium_active: listings.filter(l => l.is_premium).length
    };
    res.json({ listings, totals });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}

// K-71: Provider response rate
const getResponseRate = async (req, res) => {
  const providerId = req.params.userId;
  try {
    // Get all messages involving this provider
    const r = await db.query(
      'SELECT sender_id, recipient_id, listing_id FROM messages WHERE sender_id = $1 OR recipient_id = $1',
      [providerId]
    );
    const msgs = r.rows;

    // Incoming threads: unique (sender_id, listing_id) pairs where provider is recipient
    const incomingThreads = new Set();
    msgs.forEach(m => {
      if (String(m.recipient_id) === String(providerId)) {
        incomingThreads.add(`${m.sender_id}_${m.listing_id || 'null'}`);
      }
    });

    if (incomingThreads.size === 0) {
      return res.json({ rate: null, total: 0, replied: 0 });
    }

    // Threads the provider replied to: outgoing messages from provider
    const repliedThreads = new Set();
    msgs.forEach(m => {
      if (String(m.sender_id) === String(providerId)) {
        repliedThreads.add(`${m.recipient_id}_${m.listing_id || 'null'}`);
      }
    });

    let replied = 0;
    incomingThreads.forEach(key => {
      if (repliedThreads.has(key)) replied++;
    });

    const rate = Math.round((replied / incomingThreads.size) * 100);
    res.json({ rate, total: incomingThreads.size, replied });
  } catch (e) {
    console.error('getResponseRate error:', e);
    res.status(500).json({ error: 'Failed to compute response rate' });
  }
};

module.exports = { upsertProfile, getProfile, getProviderListings, requestVerification, adminVerifyProvider, getProviderAnalytics, getResponseRate };
