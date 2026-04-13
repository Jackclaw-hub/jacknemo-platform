const pool = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class User {
  static async create({ email, password, role, name = null }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const query = `
      INSERT INTO users (email, password_hash, role, name, verification_token, verification_token_expires)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, role, name, email_verified, verification_token, created_at, updated_at
    `;
    
    const result = await pool.query(query, [
      email, 
      hashedPassword, 
      role, 
      name,
      verificationToken,
      verificationTokenExpires
    ]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = `
      SELECT id, email, password_hash, role, name, email_verified, verification_token, verification_token_expires, created_at, updated_at
      FROM users WHERE email = $1
    `;
    
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT id, email, role, name, email_verified, created_at, updated_at
      FROM users WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByVerificationToken(token) {
    const query = `
      SELECT id, email, role, name, email_verified, verification_token_expires
      FROM users 
      WHERE verification_token = $1 
      AND verification_token_expires > NOW()
    `;
    
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  static async verifyEmail(userId) {
    const query = `
      UPDATE users 
      SET email_verified = TRUE, 
          verification_token = NULL,
          verification_token_expires = NULL,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, role, name, email_verified
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async resendVerification(email) {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const query = `
      UPDATE users 
      SET verification_token = $1,
          verification_token_expires = $2,
          updated_at = NOW()
      WHERE email = $3
      RETURNING id, email, verification_token
    `;
    
    const result = await pool.query(query, [verificationToken, verificationTokenExpires, email]);
    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateProfile(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(updates.name);
      paramCount++;
    }

    if (updates.email !== undefined) {
      fields.push(`email = $${paramCount}`);
      values.push(updates.email);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, role, name, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = User;