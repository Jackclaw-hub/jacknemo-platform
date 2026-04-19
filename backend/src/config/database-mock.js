// Mock database for testing without PostgreSQL
class MockDatabase {
  constructor() {
    this.users = [];
    this.listings = [];
    this.providerProfiles = [];
    this.nextUserId = 1;
    this.nextListingId = 1;
  }

  async query(sql, params = []) {
    const s = sql.trim().toUpperCase();
    const sl = sql.toLowerCase();

    // ---- USERS ----
    if (sl.includes('from users') || sl.includes('into users') || (s.startsWith('UPDATE') && sl.includes('users '))) {
      if (s.startsWith('SELECT')) {
        if (sql.includes('email = $1')) { const u = this.users.find(u => u.email === params[0]); return { rows: u ? [u] : [] }; }
        if (sql.includes('verification_token = $1')) { const u = this.users.find(u => u.verification_token === params[0]); return { rows: u ? [u] : [] }; }
        if (sql.includes('id = $1')) { const u = this.users.find(u => u.id === params[0]); return { rows: u ? [u] : [] }; }
        return { rows: this.users };
      }
      if (s.startsWith('INSERT')) {
        const user = { id: this.nextUserId++, email: params[0], password_hash: params[1], role: params[2], name: params[3], email_verified: params[4], verification_token: params[5], created_at: new Date(), updated_at: new Date() };
        this.users.push(user);
        return { rows: [user] };
      }
      if (s.startsWith('UPDATE')) {
        const id = params[params.length - 1];
        const idx = this.users.findIndex(u => u.id === id);
        if (idx < 0) return { rows: [] };
        const u = { ...this.users[idx] };
        if (params.includes(true)) u.email_verified = true;
        if (params.includes(null)) u.verification_token = null;
        u.updated_at = new Date();
        this.users[idx] = u;
        return { rows: [u] };
      }
    }

    // ---- PROVIDER PROFILES ----
    if (sl.includes('provider_profiles')) {
      if (s.startsWith('SELECT')) {
        const p = this.providerProfiles.find(x => x.user_id === params[0]);
        return { rows: p ? [p] : [] };
      }
      const entry = { user_id: params[0], company_name: params[1] || null, description: params[2] || null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const idx = this.providerProfiles.findIndex(x => x.user_id === params[0]);
      if (idx >= 0) this.providerProfiles[idx] = entry;
      else this.providerProfiles.push(entry);
      return { rows: [entry] };
    }

    // ---- LISTINGS (text search) ----
    if (sl.includes('lower(title)')) {
      const term = (params[0] || '').replace(/%/g, '').toLowerCase();
      const rows = this.listings.filter(x =>
        x.status === 'active' && (
          (x.title || '').toLowerCase().includes(term) ||
          (x.description || '').toLowerCase().includes(term) ||
          (x.city || '').toLowerCase().includes(term)
        )
      );
      return { rows };
    }

    // ---- LISTINGS CRUD ----
    if (sl.includes('from listings') || sl.includes('into listings') || (s.startsWith('UPDATE') && sl.includes('listings ')) || (s.startsWith('DELETE') && sl.includes('listings '))) {
      if (s.startsWith('SELECT')) {
        if (sql.includes('WHERE id = $1')) { const l = this.listings.find(x => x.id == params[0]); return { rows: l ? [l] : [] }; }
        if (sql.includes('provider_id = $1') && !sql.includes('status')) { return { rows: this.listings.filter(x => x.provider_id === params[0]) }; }
        let rows = this.listings.filter(x => x.status === params[0]);
        let pi = 1;
        if (sql.includes('type =')) rows = rows.filter(x => x.type === params[pi++]);
        if (sql.includes('geo =')) rows = rows.filter(x => x.geo === params[pi++]);
        if (sql.includes('starter_friendly =')) rows = rows.filter(x => x.starter_friendly === params[pi++]);
        rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return { rows };
      }
      if (s.startsWith('INSERT')) {
        const l = { id: this.nextListingId++, type: params[0], title: params[1], description: params[2], provider_id: params[3], provider_role: params[4], geo: params[5], city: params[6], tags: params[7], stages: params[8], sectors: params[9], starter_friendly: params[10], hourly_rate: params[11], daily_rate: params[12], from_price: params[13], status: params[14], created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        this.listings.push(l);
        return { rows: [l] };
      }
      if (s.startsWith('UPDATE')) {
        if (sql.includes('SET status')) {
          const id = params[params.length - 1];
          const idx = this.listings.findIndex(x => x.id == id);
          if (idx < 0) return { rows: [] };
          this.listings[idx].status = params[0];
          if (params[1] && typeof params[1] === 'string' && params[1].startsWith(' [REJECTED')) this.listings[idx].description += params[1];
          this.listings[idx].updated_at = new Date().toISOString();
          return { rows: [this.listings[idx]] };
        }
        const id = params[params.length - 2]; const pid = params[params.length - 1];
        const idx = this.listings.findIndex(x => x.id == id && x.provider_id === pid);
        if (idx < 0) return { rows: [] };
        this.listings[idx].updated_at = new Date().toISOString();
        return { rows: [this.listings[idx]] };
      }
      if (s.startsWith('DELETE')) {
        const idx = this.listings.findIndex(x => x.id == params[0] && x.provider_id === params[1]);
        if (idx < 0) return { rows: [] };
        const [removed] = this.listings.splice(idx, 1);
        return { rows: [{ id: removed.id }] };
      }
    }

    return { rows: [] };
  }
}

module.exports = new MockDatabase();
