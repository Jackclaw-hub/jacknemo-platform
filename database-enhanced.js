const { Pool } = require('pg');

// Mock database for development when PostgreSQL is unavailable
class MockDatabase {
  constructor() {
    this.users = [];
    this.nextId = 1;
    this.connected = true;
  }

  async query(query, params = []) {
    if (!this.connected) {
      throw new Error('Mock database connection failed');
    }

    // Mock SELECT queries
    if (query.includes('SELECT')) {
      if (query.includes('FROM users')) {
        if (query.includes('email = $1')) {
          const user = this.users.find(u => u.email === params[0]);
          return { rows: user ? [user] : [] };
        }
        if (query.includes('id = $1')) {
          const user = this.users.find(u => u.id === params[0]);
          return { rows: user ? [user] : [] };
        }
        if (query.includes('verification_token = $1')) {
          const user = this.users.find(u => u.verification_token === params[0]);
          return { rows: user ? [user] : [] };
        }
      }
    }

    // Mock INSERT queries
    if (query.includes('INSERT INTO users')) {
      const user = {
        id: this.nextId++,
        email: params[0],
        password_hash: params[1],
        role: params[2],
        name: params[3],
        email_verified: params[4] || false,
        verification_token: params[5] || null,
        created_at: new Date(),
        updated_at: new Date()
      };
      this.users.push(user);
      return { rows: [user] };
    }

    // Mock UPDATE queries
    if (query.includes('UPDATE users')) {
      const userId = params[params.length - 1];
      const userIndex = this.users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return { rows: [] };
      }

      const user = this.users[userIndex];
      
      // Update fields based on query structure
      if (query.includes('name = $1')) {
        user.name = params[0];
      }
      if (query.includes('email_verified = $1')) {
        user.email_verified = params[0];
      }
      if (query.includes('verification_token = $1')) {
        user.verification_token = params[0];
      }
      
      user.updated_at = new Date();
      
      return { rows: [user] };
    }

    // Default empty result
    return { rows: [] };
  }

  connect() {
    this.connected = true;
    return Promise.resolve();
  }

  end() {
    this.connected = false;
    return Promise.resolve();
  }
}

let pool;

try {
  // Try to create real PostgreSQL pool
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  
  // Test connection
  pool.query('SELECT NOW()')
    .then(() => console.log('✅ PostgreSQL database connected successfully'))
    .catch(err => {
      console.warn('⚠️ PostgreSQL connection failed, using mock database:', err.message);
      pool = new MockDatabase();
    });
} catch (error) {
  console.warn('⚠️ PostgreSQL module not available, using mock database:', error.message);
  pool = new MockDatabase();
}

module.exports = pool;