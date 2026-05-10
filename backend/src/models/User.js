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

  // K-80: Find user with password_hash for change-password verification
  static async findByIdWithHash(id) {
    const result = await pool.query(
      'SELECT id, email, role, name, password_hash, is_active FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
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

  // K-65: Admin user management
  static async listAll({ role, is_active, search, limit = 50, offset = 0 } = {}) {
    let sql = 'SELECT id, email, role, name, email_verified, is_active, totp_enabled, created_at FROM users WHERE 1=1';
    const params = [];
    if (role) { params.push(role); sql += ` AND role = $${params.length}`; }
    if (is_active !== undefined && is_active !== null && is_active !== '') {
      params.push(is_active === 'true' || is_active === true);
      sql += ` AND is_active = $${params.length}`;
    }
    if (search) {
      params.push('%' + search + '%');
      sql += ` AND (email ILIKE $${params.length} OR name ILIKE $${params.length})`;
    }
    sql += ' ORDER BY created_at DESC';
    params.push(limit);  sql += ` LIMIT $${params.length}`;
    params.push(offset); sql += ` OFFSET $${params.length}`;
    const result = await pool.query(sql, params);
    return result.rows;
  }

  static async countAll({ role, is_active, search } = {}) {
    let sql = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const params = [];
    if (role) { params.push(role); sql += ` AND role = $${params.length}`; }
    if (is_active !== undefined && is_active !== null && is_active !== '') {
      params.push(is_active === 'true' || is_active === true);
      sql += ` AND is_active = $${params.length}`;
    }
    if (search) {
      params.push('%' + search + '%');
      sql += ` AND (email ILIKE $${params.length} OR name ILIKE $${params.length})`;
    }
    const result = await pool.query(sql, params);
    return parseInt(result.rows[0].count, 10);
  }

  static async setActive(id, is_active) {
    const result = await pool.query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, role, name, is_active',
      [is_active, id]
    );
    return result.rows[0] || null;
  }

  // K-176: 2FA TOTP methods
  static async setTotpSecret(id, secret) {
    await pool.query(
      'UPDATE users SET totp_secret = $1, totp_enabled = false, updated_at = NOW() WHERE id = $2',
      [secret, id]
    );
  }

  static async enableTotp(id, backupCodes) {
    await pool.query(
      'UPDATE users SET totp_enabled = true, totp_backup_codes = $1, updated_at = NOW() WHERE id = $2',
      [backupCodes, id]
    );
  }

  static async disableTotp(id) {
    await pool.query(
      'UPDATE users SET totp_secret = NULL, totp_enabled = false, totp_backup_codes = NULL, updated_at = NOW() WHERE id = $1',
      [id]
    );
  }

  static async findByIdWithTotp(id) {
    const result = await pool.query(
      'SELECT id, email, role, name, password_hash, totp_secret, totp_enabled, totp_backup_codes FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByEmailWithTotp(email) {
    const result = await pool.query(
      'SELECT id, email, password_hash, role, name, email_verified, totp_secret, totp_enabled, totp_backup_codes, is_active FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async consumeBackupCode(id, code) {
    const result = await pool.query(
      'SELECT totp_backup_codes FROM users WHERE id = $1',
      [id]
    );
    if (!result.rows[0]) return false;
    const codes = result.rows[0].totp_backup_codes || [];
    const idx = codes.indexOf(code);
    if (idx === -1) return false;
    codes.splice(idx, 1);
    await pool.query('UPDATE users SET totp_backup_codes = $1, updated_at = NOW() WHERE id = $2', [codes, id]);
    return true;
  }
}

module.exports = User;
