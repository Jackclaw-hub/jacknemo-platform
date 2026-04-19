const pool = require("../config/database");

const upsertProfile = async (userId, data) => {
  const { company_name, stage, sector, city, geo, team_size, description } = data;
  const query = `
    INSERT INTO founder_profiles (user_id, company_name, stage, sector, city, geo, team_size, description, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      stage = EXCLUDED.stage,
      sector = EXCLUDED.sector,
      city = EXCLUDED.city,
      geo = EXCLUDED.geo,
      team_size = EXCLUDED.team_size,
      description = EXCLUDED.description,
      updated_at = NOW()
    RETURNING *
  `;
  const result = await pool.query(query, [userId, company_name, stage, sector, city, geo, team_size, description]);
  return result.rows[0];
};

const getProfile = async (userId) => {
  const result = await pool.query("SELECT * FROM founder_profiles WHERE user_id = $1", [userId]);
  return result.rows[0] || null;
};

module.exports = { upsertProfile, getProfile };
