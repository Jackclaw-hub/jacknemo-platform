// Use mock database for testing
console.log('⚠️ Using mock database for testing');
var pool = require('../config/database-mock');

class User {
  static async create(userData) {
    const { email, password_hash, role, name, email_verified = false, verification_token } = userData;
    
    const query = `
      INSERT INTO users (email, password_hash, role, name, email_verified, verification_token, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, email, role, name, email_verified, verification_token, created_at, updated_at
    `;
    
    const result = await pool.query(query, [
      email, 
      password_hash, 
      role, 
      name,
      email_verified,
      verification_token
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
      SELECT id, email, role, name, email_verified
      FROM users 
      WHERE verification_token = $1
    `;
    
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  static async update(id, updates) {
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

    if (updates.password_hash !== undefined) {
      fields.push(`password_hash = $${paramCount}`);
      values.push(updates.password_hash);
      paramCount++;
    }

    if (updates.email_verified !== undefined) {
      fields.push(`email_verified = $${paramCount}`);
      values.push(updates.email_verified);
      paramCount++;
    }

    if (updates.verification_token !== undefined) {
      fields.push(`verification_token = $${paramCount}`);
      values.push(updates.verification_token);
      paramCount++;
    }

    if (updates.updated_at !== undefined) {
      fields.push(`updated_at = $${paramCount}`);
      values.push(updates.updated_at);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, role, name, email_verified, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
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