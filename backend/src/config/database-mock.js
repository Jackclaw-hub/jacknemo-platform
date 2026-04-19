// Mock database for testing without PostgreSQL
class MockDatabase {
  constructor() {
    this.users = [];
    this.listings = [];
    this.nextUserId = 1;
    this.nextListingId = 1;
  }

  async query(sql, params = []) {
    const s = sql.trim().toUpperCase();

    // ---- USERS ----
    if (s.includes("FROM USERS") || s.includes("INTO USERS") || (s.startsWith("UPDATE") && sql.includes("users "))) {
      if (s.startsWith("SELECT")) {
        if (sql.includes("email = $1")) {
          const u = this.users.find(u => u.email === params[0]);
          return { rows: u ? [u] : [] };
        }
        if (sql.includes("verification_token = $1")) {
          const u = this.users.find(u => u.verification_token === params[0]);
          return { rows: u ? [u] : [] };
        }
        if (sql.includes("id = $1")) {
          const u = this.users.find(u => u.id === params[0]);
          return { rows: u ? [u] : [] };
        }
        return { rows: this.users };
      }
      if (s.startsWith("INSERT")) {
        const user = {
          id: this.nextUserId++,
          email: params[0], password_hash: params[1], role: params[2],
          name: params[3], email_verified: params[4],
          verification_token: params[5],
          created_at: new Date(), updated_at: new Date()
        };
        this.users.push(user);
        return { rows: [user] };
      }
      if (s.startsWith("UPDATE")) {
        const id = params[params.length - 1];
        const idx = this.users.findIndex(u => u.id === id);
        if (idx < 0) return { rows: [] };
        const u = { ...this.users[idx] };
        // email_verified update
        if (params.includes(true)) u.email_verified = true;
        if (params.includes(null)) u.verification_token = null;
        u.updated_at = new Date();
        this.users[idx] = u;
        return { rows: [u] };
      }
    }

    // ---- LISTINGS ----
    if (s.includes("FROM LISTINGS") || s.includes("INTO LISTINGS") || (s.startsWith("UPDATE") && sql.includes("listings ")) || (s.startsWith("DELETE") && sql.includes("listings "))) {
      if (s.startsWith("SELECT")) {
        if (sql.includes("WHERE id = $1")) {
          const l = this.listings.find(x => x.id == params[0]);
          return { rows: l ? [l] : [] };
        }
        if (sql.includes("provider_id = $1") && !sql.includes("status")) {
          return { rows: this.listings.filter(x => x.provider_id === params[0]) };
        }
        // findAll with status + optional filters
        let rows = this.listings.filter(x => x.status === params[0]);
        let pIdx = 1;
        if (sql.includes("type =")) { rows = rows.filter(x => x.type === params[pIdx++]); }
        if (sql.includes("geo =")) { rows = rows.filter(x => x.geo === params[pIdx++]); }
        if (sql.includes("starter_friendly =")) { rows = rows.filter(x => x.starter_friendly === params[pIdx++]); }
        rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return { rows };
      }
      if (s.startsWith("INSERT")) {
        const listing = {
          id: this.nextListingId++,
          type: params[0], title: params[1], description: params[2],
          provider_id: params[3], provider_role: params[4], geo: params[5], city: params[6],
          tags: params[7], stages: params[8], sectors: params[9],
          starter_friendly: params[10], hourly_rate: params[11], daily_rate: params[12],
          from_price: params[13], status: params[14],
          created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        };
        this.listings.push(listing);
        return { rows: [listing] };
      }
      if (s.startsWith("UPDATE")) {
        // updateStatus: UPDATE listings SET status=$1[,description=...] ... WHERE id=$N
        if (sql.includes("SET status")) {
          const id = params[params.length - 1];
          const idx = this.listings.findIndex(x => x.id == id);
          if (idx < 0) return { rows: [] };
          this.listings[idx].status = params[0];
          if (params[1] && typeof params[1] === "string" && params[1].startsWith(" [REJECTED")) {
            this.listings[idx].description += params[1];
          }
          this.listings[idx].updated_at = new Date().toISOString();
          return { rows: [this.listings[idx]] };
        }
        // update by id + provider_id
        const id = params[params.length - 2];
        const providerId = params[params.length - 1];
        const idx = this.listings.findIndex(x => x.id == id && x.provider_id === providerId);
        if (idx < 0) return { rows: [] };
        this.listings[idx].updated_at = new Date().toISOString();
        return { rows: [this.listings[idx]] };
      }
      if (s.startsWith("DELETE")) {
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
