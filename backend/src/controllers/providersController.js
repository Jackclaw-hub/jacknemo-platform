const pool = require("../config/database");

// GET /api/providers/profile — own profile (authenticated)
const getProfile = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM provider_profiles WHERE user_id = $1", [req.user.id]);
    res.json({ profile: result.rows[0] || null });
  } catch (err) {
    console.error("getProviderProfile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// POST /api/providers/profile — save own profile (authenticated)
const saveProfile = async (req, res) => {
  const { company_name, description, website, contact_email, logo_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO provider_profiles (user_id, company_name, description, website, contact_email, logo_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE
         SET company_name = EXCLUDED.company_name,
             description = EXCLUDED.description,
             website = EXCLUDED.website,
             contact_email = EXCLUDED.contact_email,
             logo_url = EXCLUDED.logo_url,
             updated_at = NOW()
       RETURNING *`,
      [req.user.id, company_name || null, description || null, website || null, contact_email || null, logo_url || null]
    );
    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error("saveProviderProfile:", err);
    res.status(500).json({ error: "Failed to save profile" });
  }
};

// GET /api/providers/:id/profile — public profile (no auth)
const getPublicProfile = async (req, res) => {
  try {
    const uid = parseInt(req.params.id);
    if (isNaN(uid)) return res.status(400).json({ error: "Invalid user id" });
    const result = await pool.query("SELECT * FROM provider_profiles WHERE user_id = $1", [uid]);
    res.json({ profile: result.rows[0] || null });
  } catch (err) {
    console.error("getPublicProfile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// GET /api/providers/:id/listings — public active listings for a provider
const getPublicListings = async (req, res) => {
  try {
    const uid = parseInt(req.params.id);
    if (isNaN(uid)) return res.status(400).json({ error: "Invalid user id" });
    const result = await pool.query(
      "SELECT * FROM listings WHERE provider_id = $1 AND status = $2 ORDER BY created_at DESC",
      [uid, "active"]
    );
    res.json({ listings: result.rows });
  } catch (err) {
    console.error("getPublicListings:", err);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
};

module.exports = { getProfile, saveProfile, getPublicProfile, getPublicListings };
