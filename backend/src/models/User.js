var pool = require("../config/database");

class User {
  static async create(userData) {
    const { email, password_hash, role, name, email_verified = false, verification_token, referral_code = null, referred_by = null } = userData;
    const query = `
      INSERT INTO users (email, password_hash, role, name, email_verified, verification_token, referral_code, referred_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, email, role, name, email_verified, verification_token, referral_code, referred_by, created_at, updated_at
    `;
    const result = await pool.query(query, [email, password_hash, role, name, email_verified, verification_token, referral_code, referred_by]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT id, email, password_hash, role, name, email_verified, verification_token, referral_code, referred_by, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, email, role, name, email_verified, referral_code, referred_by, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByVerificationToken(token) {
    const result = await pool.query(
      'SELECT id, email, role, name, email_verified FROM users WHERE verification_token = $1',
      [token]
    );
    return result.rows[0] || null;
  }

  static async findByReferralCode(code) {
    const result = await pool.query(
      'SELECT id, email, name, referral_code FROM users WHERE referral_code = $1',
      [code]
    );
    return result.rows[0] || null;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    const allowed = ['name', 'email', 'password_hash', 'email_verified', 'verification_token', 'updated_at'];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    }
    if (fields.length === 0) throw new Error('No valid fields to update');
    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, email, role, name, email_verified, referral_code, created_at, updated_at`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // K-22: Password reset
  static async setResetToken(id, token, expires) {
    await pool.query(
      "UPDATE users SET reset_token = $1, reset_expires = $2, updated_at = NOW() WHERE id = $3",
      [token, expires, id]
    );
  }

  static async findByResetToken(token) {
    const result = await pool.query(
      "SELECT * FROM users WHERE reset_token = $1 AND reset_expires > $2",
      [token, new Date().toISOString()]
    );
    return result.rows[0] || null;
  }

  static async updatePassword(id, hash) {
    await pool.query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_expires = NULL, updated_at = NOW() WHERE id = $2",
      [hash, id]
    );
  }
}

module.exports = User;
