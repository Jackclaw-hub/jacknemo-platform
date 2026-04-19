// Mock database for testing without PostgreSQL
class MockDatabase {
  constructor() {
    this.users = [];
    this.nextId = 1; this.listings = []; this.nextListingId = 0;
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
    // Mock listings queries
    if (sql.includes('FROM listings')) {
      if (sql.includes('WHERE id')) {
        const id = params[0];
        const l = this.listings.find(x => x.id == id);
        return { rows: l ? [l] : [] };
      }
      if (sql.includes('provider_id')) {
        const pid = params[0];
        return { rows: this.listings.filter(x => x.provider_id === pid) };
      }
      // findAll with filters
      let rows = this.listings.filter(x => x.status === params[0]);
      for (let i = 1; i < params.length; i++) {
        if (sql.includes('type')) rows = rows.filter(x => x.type === params[i]);
        if (sql.includes('geo')) rows = rows.filter(x => x.geo === params[i]);
        if (sql.includes('starter_friendly')) rows = rows.filter(x => x.starter_friendly === params[i]);
      }
      return { rows };
    }
    if (sql.includes('INTO listings')) {
      const id = ++this.nextListingId;
      const listing = {
        id, type: params[0], title: params[1], description: params[2],
        provider_id: params[3], provider_role: params[4], geo: params[5], city: params[6],
        tags: params[7], stages: params[8], sectors: params[9],
        starter_friendly: params[10], hourly_rate: params[11], daily_rate: params[12],
        from_price: params[13], status: params[14],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
      this.listings.push(listing);
      return { rows: [listing] };
    }
    if (sql.includes('UPDATE listings')) {
      const idIdx = params.length - 2;
      const pidIdx = params.length - 1;
      const idx = this.listings.findIndex(x => x.id == params[idIdx] && x.provider_id === params[pidIdx]);
      if (idx < 0) return { rows: [] };
      Object.assign(this.listings[idx], { updated_at: new Date().toISOString() });
      return { rows: [this.listings[idx]] };
    }
    if (sql.includes('DELETE FROM listings')) {
      const idx = this.listings.findIndex(x => x.id == params[0] && x.provider_id === params[1]);
      if (idx < 0) return { rows: [] };
      const [removed] = this.listings.splice(idx, 1);
      return { rows: [{ id: removed.id }] };
    }
