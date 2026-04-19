const db = require('../config/database');

const upsertProfile = async (req, res) => {
  try {
    const { company_name, description, website, contact_email, logo_url } = req.body;
    const result = await db.query(
      `INSERT INTO provider_profiles (user_id, company_name, description, website, contact_email, logo_url, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         description = EXCLUDED.description,
         website = EXCLUDED.website,
         contact_email = EXCLUDED.contact_email,
         logo_url = EXCLUDED.logo_url,
         updated_at = NOW()
       RETURNING *`,
      [req.user.id, company_name, description, website, contact_email, logo_url]
    );
    res.json({ profile: result.rows[0] });
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
      `SELECT * FROM listings WHERE provider_id=$1 AND status='approved' ORDER BY created_at DESC`,
      [req.params.userId]
    );
    res.json({ listings: result.rows });
  } catch (err) {
    console.error('getProviderListings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};

module.exports = { upsertProfile, getProfile, getProviderListings };
