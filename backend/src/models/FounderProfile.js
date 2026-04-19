const db = require('../config/database');

class FounderProfile {
  static async upsert(userId, data) {
    const { company_name, stage, sector, city, geo, team_size, description } = data;
    const res = await db.query(
      `INSERT INTO founder_profiles (user_id, company_name, stage, sector, city, geo, team_size, description, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         company_name=EXCLUDED.company_name, stage=EXCLUDED.stage,
         sector=EXCLUDED.sector, city=EXCLUDED.city, geo=EXCLUDED.geo,
         team_size=EXCLUDED.team_size, description=EXCLUDED.description,
         updated_at=NOW()
       RETURNING *`,
      [userId, company_name, stage, sector, city, geo, team_size, description]
    );
    return res.rows[0];
  }
  static async findByUserId(userId) {
    const res = await db.query('SELECT * FROM founder_profiles WHERE user_id=$1', [userId]);
    return res.rows[0] || null;
  }
}
module.exports = FounderProfile;
