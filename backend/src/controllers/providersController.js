const pool = require("../config/database");

const getProfile = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM provider_profiles WHERE user_id = \$1", [req.user.id]);
    res.json({ profile: result.rows[0] || null });
  } catch (err) {
    console.error("getProviderProfile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const saveProfile = async (req, res) => {
  const { company_name, description } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO provider_profiles (user_id, company_name, description, created_at, updated_at)
       VALUES (\$1, \$2, \$3, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE
         SET company_name = EXCLUDED.company_name,
             description = EXCLUDED.description,
             updated_at = NOW()
       RETURNING *`,
      [req.user.id, company_name || null, description || null]
    );
    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error("saveProviderProfile:", err);
    res.status(500).json({ error: "Failed to save profile" });
  }
};

module.exports = { getProfile, saveProfile };
