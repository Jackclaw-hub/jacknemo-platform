// Mock database for testing without PostgreSQL
class MockDatabase {
  constructor() {
    this.users = [];
    this.nextId = 1;
  }

  async query(sql, params = []) {
    // Mock SELECT queries
    if (sql.includes('SELECT')) {
      if (sql.includes('email = $1')) {
        const email = params[0];
        const user = this.users.find(u => u.email === email);
        return { rows: user ? [user] : [] };
      }
      if (sql.includes('id = $1')) {
        const id = params[0];
        const user = this.users.find(u => u.id === id);
        return { rows: user ? [user] : [] };
      }
      if (sql.includes('verification_token = $1')) {
        const token = params[0];
        const user = this.users.find(u => u.verification_token === token);
        return { rows: user ? [user] : [] };
      }
    }

    // Mock INSERT queries
    if (sql.includes('INSERT')) {
      const user = {
        id: this.nextId++,
        email: params[0],
        password_hash: params[1],
        role: params[2],
        name: params[3],
        email_verified: params[4],
        verification_token: params[5],
        created_at: new Date(),
        updated_at: new Date()
      };
      this.users.push(user);
      return { rows: [user] };
    }

    // Mock UPDATE queries
    if (sql.includes('UPDATE')) {
      const id = params[params.length - 1];
      const userIndex = this.users.findIndex(u => u.id === id);
      
      if (userIndex === -1) {
        return { rows: [] };
      }

      const user = this.users[userIndex];
      
      // Update fields based on parameters
      if (params.includes('Updated Test User')) {
        user.name = 'Updated Test User';
      }
      if (params.includes(true)) {
        user.email_verified = true;
        user.verification_token = null;
      }
      if (params.includes(null)) {
        user.verification_token = null;
      }

      user.updated_at = new Date();
      this.users[userIndex] = user;
      
      return { rows: [user] };
    }

    return { rows: [] };
  }
}

module.exports = new MockDatabase();