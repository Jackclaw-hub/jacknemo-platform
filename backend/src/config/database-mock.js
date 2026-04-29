// Mock database for testing without PostgreSQL
class MockDatabase {
  constructor() {
    // Seed admin user for development (password: admin2026!)
    // bcrypt hash generated at startup to avoid hard-coding
    const crypto = require('crypto');
    const adminId = 9999;
    this.users = [{
      id: adminId,
      email: 'admin@nemoclaw.dev',
      password_hash: 'pbkdf2$100000$9955115f1bfbfd437a9ca43b98e1fad0$bdc7e1d66dcf26984b8d0c88a3f579b8ab7866626f6d46ada7bac352c2ff3a4c7e4dc9561dbaef43a3877e4595929dcd995635a28c21eb3cf86968f3370c041e', // admin2026!
      role: 'admin',
      name: 'NemoClaw Admin',
      email_verified: true,
      verification_token: null,
      referral_code: 'ADMIN99',
      referred_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];
    this.listings = [];
    this.providerProfiles = [];
    this.founderProfiles = [];
    this.messages = [];
    this.ratings = [];
    this.bookmarks = []; // saved_listings
    this.notifications = [];
    this.nextNotificationId = 1;
    this.nextUserId = 10000;
    this.nextListingId = 1;
    this.nextMessageId = 1;
    this.nextRatingId = 1;
  }

  async query(sql, params = []) {
    const s = sql.trim().toUpperCase();
    const sl = sql.toLowerCase();

    // ---- USERS ----
    if (sl.includes('from users') || sl.includes('into users') || (s.startsWith('UPDATE') && sl.includes('users '))) {
      if (s.startsWith('SELECT')) {
        if (sql.includes('email = $1')) { const u = this.users.find(u => u.email === params[0]); return { rows: u ? [u] : [] }; }
        if (sql.includes('verification_token = $1')) { const u = this.users.find(u => u.verification_token === params[0]); return { rows: u ? [u] : [] }; }
        if (sql.includes('referral_code = $1')) { const u = this.users.find(u => u.referral_code === params[0]); return { rows: u ? [u] : [] }; }
        if (sql.includes('reset_token = $1')) {
          const now = new Date().toISOString();
          const u = this.users.find(u => u.reset_token === params[0] && u.reset_expires > now);
          return { rows: u ? [u] : [] };
        }
        if (sql.includes('id = $1')) { const u = this.users.find(u => u.id === params[0]); return { rows: u ? [u] : [] }; }
        return { rows: this.users };
      }
      if (s.startsWith('INSERT')) {
        // params: email, password_hash, role, name, email_verified, verification_token, referral_code, referred_by
        const user = {
          id: this.nextUserId++,
          email: params[0],
          password_hash: params[1],
          role: params[2],
          name: params[3],
          email_verified: params[4],
          verification_token: params[5],
          referral_code: params[6] || null,
          referred_by: params[7] || null,
          created_at: new Date(),
          updated_at: new Date()
        };
        this.users.push(user);
        return { rows: [user] };
      }
      if (s.startsWith('UPDATE')) {
        if (sl.includes('reset_token') && sl.includes('reset_expires') && !sl.includes('password_hash')) {
          const id = params[2];
          const idx = this.users.findIndex(u => u.id === id || u.id == id);
          if (idx >= 0) { this.users[idx].reset_token = params[0]; this.users[idx].reset_expires = params[1]; }
          return { rows: [] };
        }
        if (sl.includes('password_hash') && sl.includes('reset_token')) {
          const id = params[1];
          const idx = this.users.findIndex(u => u.id === id || u.id == id);
          if (idx >= 0) { this.users[idx].password_hash = params[0]; this.users[idx].reset_token = null; this.users[idx].reset_expires = null; }
          return { rows: [] };
        }
        const id = params[params.length - 1];
        const idx = this.users.findIndex(u => u.id === id);
        if (idx < 0) return { rows: [] };
        const u = { ...this.users[idx] };
        if (params.includes(true)) u.email_verified = true;
        if (params.includes(null)) u.verification_token = null;
        if (sql.includes('name =') && typeof params[0] === 'string' && !params[0].includes('@')) u.name = params[0];
        u.updated_at = new Date();
        this.users[idx] = u;
        return { rows: [u] };
      }
    }

    // ---- PROVIDER PROFILES ----
    if (sl.includes('provider_profiles')) {
      if (s.startsWith('SELECT')) {
        // K-37: JOIN with users for pending verification queue
        if (sl.includes('join users') && sl.includes("verification_status = 'pending'")) {
          const pending = this.providerProfiles.filter(p => p.verification_status === 'pending');
          return { rows: pending.map(p => {
            const u = this.users.find(u => u.id === p.user_id || u.id == p.user_id) || {};
            return { ...p, email: u.email || '', name: u.name || '' };
          })};
        }
        // Public profile lookup by user_id (numeric param)
        const uid = params[0];
        if (uid !== undefined) {
          const p = this.providerProfiles.find(x => x.user_id === uid || x.user_id == uid);
          return { rows: p ? [p] : [] };
        }
        return { rows: this.providerProfiles };
      }
      if (s.startsWith('UPDATE')) {
        // K-35: verification update — UPDATE provider_profiles SET ... WHERE user_id = 
        const userId = params[params.length - 1];
        const idx = this.providerProfiles.findIndex(x => x.user_id === userId || x.user_id == userId);
        if (idx < 0) return { rows: [] };
        if (sl.includes('verification_status') && sl.includes('is_verified')) {
          // adminVerifyProvider: is_verified, verification_status, verification_reason, reviewed_at, user_id
          this.providerProfiles[idx].is_verified = params[0];
          this.providerProfiles[idx].verification_status = params[1];
          this.providerProfiles[idx].verification_reason = params[2];
          this.providerProfiles[idx].verification_reviewed_at = params[3];
        } else if (sl.includes('verification_status')) {
          // requestVerification: verification_status, requested_at, user_id
          this.providerProfiles[idx].verification_status = params[0];
          this.providerProfiles[idx].verification_requested_at = params[1];
        }
        return { rows: [this.providerProfiles[idx]] };
      }
      const entry = {
        user_id: params[0],
        company_name: params[1] || null,
        description: params[2] || null,
        website: params[3] || null,
        contact_email: params[4] || null,
        logo_url: params[5] || null,
        is_verified: false,
        verification_status: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const idx = this.providerProfiles.findIndex(x => x.user_id === params[0]);
      if (idx >= 0) this.providerProfiles[idx] = entry;
      else this.providerProfiles.push(entry);
      return { rows: [entry] };
    }

    // ---- FOUNDER PROFILES ----
    if (sl.includes('founder_profiles')) {
      if (s.startsWith('SELECT')) {
        const uid = params[0];
        const p = this.founderProfiles.find(x => x.user_id === uid || x.user_id == uid);
        return { rows: p ? [p] : [] };
      }
      const entry = {
        user_id: params[0],
        company_name: params[1] || null,
        stage: params[2] || null,
        sector: params[3] || null,
        city: params[4] || null,
        geo: params[5] || null,
        team_size: params[6] || null,
        description: params[7] || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const idx = this.founderProfiles.findIndex(x => x.user_id === params[0]);
      if (idx >= 0) this.founderProfiles[idx] = entry;
      else this.founderProfiles.push(entry);
      return { rows: [entry] };
    }

    // ---- MESSAGES ----
    if (sl.includes('messages')) {
      if (s.startsWith('INSERT')) {
        const msg = {
          id: this.nextMessageId++,
          sender_id: params[0],
          recipient_id: params[1],
          listing_id: params[2] || null,
          body: params[3],
          read: false,
          created_at: new Date().toISOString()
        };
        this.messages.push(msg);
        return { rows: [msg] };
      }
      if (s.startsWith('SELECT')) {
        // Thread query: messages between two users for a listing
        if (sql.includes('sender_id') && sql.includes('recipient_id') && sql.includes('ORDER')) {
          const uid1 = params[0], uid2 = params[1];
          const listingId = params[2];
          let msgs = this.messages.filter(m =>
            ((m.sender_id == uid1 && m.recipient_id == uid2) ||
             (m.sender_id == uid2 && m.recipient_id == uid1)) &&
            (listingId == null || m.listing_id == listingId)
          );
          msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          // Enrich with sender name
          return {
            rows: msgs.map(m => {
              const sender = this.users.find(u => u.id == m.sender_id);
              return { ...m, sender_name: sender ? sender.name : null };
            })
          };
        }
        // Unread count for a user
        if (sql.includes('count') || sql.includes('COUNT')) {
          const uid = params[0];
          const count = this.messages.filter(m => m.recipient_id == uid && !m.read).length;
          return { rows: [{ count: String(count) }] };
        }
        // All messages for a user (for threads list)
        const uid = params[0];
        const msgs = this.messages.filter(m => m.sender_id == uid || m.recipient_id == uid);
        return { rows: msgs };
      }
      if (s.startsWith('UPDATE')) {
        // Mark read
        const uid = params[0], otherId = params[1];
        this.messages.forEach(m => {
          if (m.recipient_id == uid && m.sender_id == otherId) m.read = true;
        });
        return { rows: [] };
      }
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
        if (sql.includes('provider_id = $1') && !sql.includes('status')) { return { rows: this.listings.filter(x => x.provider_id == params[0]) }; }
        // Public listings by provider (active only)
        if (sql.includes('provider_id = $1') && sql.includes('status = $2')) {
          return { rows: this.listings.filter(x => x.provider_id == params[0] && x.status === params[1]) };
        }
        // K-60: Admin all-listings query with WHERE 1=1 + dynamic filters
        if (sql.includes('WHERE 1=1')) {
          let rows = [...this.listings];
          let pi = 0;
          if (sql.includes('status =')) { rows = rows.filter(x => x.status === params[pi++]); }
          if (sql.includes('type =')) { rows = rows.filter(x => x.type === params[pi++]); }
          if (sql.includes('LOWER(title) LIKE')) {
            const term = (params[pi++] || '').replace(/%/g, '').toLowerCase();
            rows = rows.filter(x => (x.title||'').toLowerCase().includes(term) || (x.description||'').toLowerCase().includes(term) || (x.city||'').toLowerCase().includes(term));
          }
          rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          return { rows };
        }
        let rows = this.listings.filter(x => x.status === params[0]);
        let pi = 1;
        if (sql.includes('type =')) rows = rows.filter(x => x.type === params[pi++]);
        if (sql.includes('geo =')) rows = rows.filter(x => x.geo === params[pi++]);
        if (sql.includes('starter_friendly =')) rows = rows.filter(x => x.starter_friendly === params[pi++]);
        if (sql.includes('is_premium =')) rows = rows.filter(x => x.is_premium === params[pi++]);
        // K-49: tag filter — handled post-query by Listing.findAll() JS layer; mock doesn't need SQL-level filter
        rows.sort((a, b) => {
          const aPremium = a.is_premium && (!a.premium_expires_at || a.premium_expires_at > new Date().toISOString());
          const bPremium = b.is_premium && (!b.premium_expires_at || b.premium_expires_at > new Date().toISOString());
          if (aPremium && !bPremium) return -1;
          if (!aPremium && bPremium) return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        return { rows };
      }
      if (s.startsWith('INSERT')) {
        const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
        const l = { id: this.nextListingId++, type: params[0], title: params[1], description: params[2], provider_id: params[3], provider_role: params[4], geo: params[5], city: params[6], tags: params[7], stages: params[8], sectors: params[9], starter_friendly: params[10], hourly_rate: params[11], daily_rate: params[12], from_price: params[13], status: params[14], image_url: params[15] || null, featured: false, is_premium: false, premium_expires_at: null, expires_at: expiresAt, view_count: 0, contact_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        this.listings.push(l);
        return { rows: [l] };
      }
      if (s.startsWith('UPDATE')) {
        if (sql.includes('SET view_count')) {
          const id = params[0];
          const idx = this.listings.findIndex(x => x.id == id);
          if (idx >= 0) this.listings[idx].view_count = (this.listings[idx].view_count || 0) + 1;
          return { rows: [] };
        }
        if (sql.includes('SET contact_count')) {
          const id = params[0];
          const idx = this.listings.findIndex(x => x.id == id);
          if (idx >= 0) this.listings[idx].contact_count = (this.listings[idx].contact_count || 0) + 1;
          return { rows: [] };
        }
        if (sql.includes('SET is_premium')) {
          const id = params[2];
          const idx = this.listings.findIndex(x => x.id == id);
          if (idx < 0) return { rows: [] };
          this.listings[idx].is_premium = params[0];
          this.listings[idx].premium_expires_at = params[1];
          this.listings[idx].updated_at = new Date().toISOString();
          return { rows: [this.listings[idx]] };
        }
        if (sql.includes('SET featured')) {
          const featured = params[0];
          const id = params[1];
          const idx = this.listings.findIndex(x => x.id == id);
          if (idx < 0) return { rows: [] };
          this.listings[idx].featured = featured;
          this.listings[idx].updated_at = new Date().toISOString();
          return { rows: [this.listings[idx]] };
        }
        // K-56: Renew — SET status='active', expires_at = NOW() + INTERVAL '90 days'
        if (sql.includes('expires_at') && sql.includes('INTERVAL') && sql.includes('provider_id')) {
          const id = params[0]; const pid = params[1];
          const idx = this.listings.findIndex(x => x.id == id && x.provider_id == pid && ['active','expired'].includes(x.status));
          if (idx < 0) return { rows: [] };
          this.listings[idx].status = 'active';
          this.listings[idx].expires_at = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
          this.listings[idx].updated_at = new Date().toISOString();
          return { rows: [this.listings[idx]] };
        }
        // K-56: Expire cron — SET status='expired' WHERE status='active' AND expires_at < NOW()
        if (sql.includes("status='expired'") && sql.includes('expires_at') && !params.length) {
          const now = new Date().toISOString();
          const expired = [];
          this.listings.forEach((l, i) => {
            if (l.status === 'active' && l.expires_at && l.expires_at < now) {
              this.listings[i].status = 'expired';
              this.listings[i].updated_at = new Date().toISOString();
              expired.push({ id: l.id });
            }
          });
          return { rows: expired };
        }
        if (sql.includes('SET status')) {
          const id = params[params.length - 1];
          const idx = this.listings.findIndex(x => x.id == id);
          if (idx < 0) return { rows: [] };
          // Status may be a literal in SQL ("SET status = 'pending'") or parameterized ($1)
          const litMatch = sql.match(/status\s*=\s*'([^']+)'/);
          const newStatus = litMatch ? litMatch[1] : params[0];
          this.listings[idx].status = newStatus;
          if (params[1] && typeof params[1] === 'string' && params[1].startsWith(' [REJECTED')) this.listings[idx].description += params[1];
          this.listings[idx].updated_at = new Date().toISOString();
          return { rows: [this.listings[idx]] };
        }
        // General field update — parse SET clause to apply changes
        const id = params[params.length - 2]; const pid = params[params.length - 1];
        const idx = this.listings.findIndex(x => x.id == id && x.provider_id == pid);
        if (idx < 0) return { rows: [] };
        // Extract field=value pairs from "SET field1 = $1, field2 = $2, ..."
        const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
        if (setMatch) {
          const pairs = setMatch[1].split(',');
          pairs.forEach((pair, i) => {
            const colMatch = pair.trim().match(/^(\w+)\s*=/);
            if (colMatch) {
              const col = colMatch[1].toLowerCase().trim();
              if (col !== 'updated_at' && i < params.length - 2) {
                this.listings[idx][col] = params[i];
              }
            }
          });
        }
        this.listings[idx].updated_at = new Date().toISOString();
        return { rows: [this.listings[idx]] };
      }
      if (s.startsWith('DELETE')) {
        const idx = this.listings.findIndex(x => x.id == params[0] && x.provider_id == params[1]);
        if (idx < 0) return { rows: [] };
        const [removed] = this.listings.splice(idx, 1);
        return { rows: [{ id: removed.id }] };
      }
    }

    // ---- PROVIDER RATINGS ----
    if (sl.includes('provider_ratings')) {
      if (s.startsWith('INSERT')) {
        // params: provider_id, rater_id, listing_id, rating, comment
        const r = {
          id: this.nextRatingId++,
          provider_id: params[0],
          rater_id: params[1],
          listing_id: params[2] || null,
          rating: params[3],
          comment: params[4] || null,
          created_at: new Date().toISOString()
        };
        // Upsert: one rating per rater per provider
        const existing = this.ratings.findIndex(x => x.provider_id == params[0] && x.rater_id == params[1]);
        if (existing >= 0) this.ratings[existing] = { ...this.ratings[existing], rating: params[3], comment: params[4] || null };
        else this.ratings.push(r);
        return { rows: [r] };
      }
      if (s.startsWith('SELECT')) {
        if (sql.includes('AVG') || sql.includes('avg')) {
          const pid = params[0];
          const rs = this.ratings.filter(x => x.provider_id == pid);
          const avg = rs.length ? rs.reduce((s, x) => s + Number(x.rating), 0) / rs.length : null;
          return { rows: [{ avg_rating: avg ? avg.toFixed(2) : null, count: String(rs.length) }] };
        }
        const pid = params[0];
        const rs = this.ratings.filter(x => x.provider_id == pid);
        return {
          rows: rs.map(r => {
            const rater = this.users.find(u => u.id == r.rater_id);
            return { ...r, rater_name: rater ? rater.name : null };
          })
        };
      }
    }

    // ---- NOTIFICATIONS ----
    if (sl.includes('notifications')) {
      if (s.startsWith('INSERT')) {
        const n = {
          id: this.nextNotificationId++,
          user_id: params[0], type: params[1], subject: params[2], body: params[3],
          read_at: null, created_at: new Date().toISOString()
        };
        this.notifications.push(n);
        return { rows: [n] };
      }
      if (s.startsWith('SELECT')) {
        const uid = params[0];
        const rows = this.notifications
          .filter(n => n.user_id == uid)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 30);
        return { rows };
      }
      if (s.startsWith('UPDATE')) {
        const uid = params[0];
        if (sql.includes('id = $1')) {
          // mark single read: params = [id, user_id]
          const n = this.notifications.find(n => n.id == params[0] && n.user_id == params[1]);
          if (n) n.read_at = new Date().toISOString();
        } else {
          // mark all read
          this.notifications.filter(n => n.user_id == uid && !n.read_at)
            .forEach(n => { n.read_at = new Date().toISOString(); });
        }
        return { rows: [] };
      }
    }

    // ---- SAVED LISTINGS (bookmarks) ----
    if (sl.includes('saved_listings')) {
      if (s.startsWith('INSERT')) {
        const userId = params[0], listingId = params[1];
        const exists = this.bookmarks.find(b => b.user_id == userId && b.listing_id == listingId);
        if (exists) return { rows: [] }; // ON CONFLICT DO NOTHING
        const bm = { user_id: userId, listing_id: listingId, saved_at: new Date().toISOString() };
        this.bookmarks.push(bm);
        return { rows: [bm] };
      }
      if (s.startsWith('SELECT')) {
        const userId = params[0];
        const bms = this.bookmarks.filter(b => b.user_id == userId);
        // JOIN with listings
        const rows = bms.map(b => {
          const l = this.listings.find(x => x.id == b.listing_id) || {};
          return { listing_id: b.listing_id, saved_at: b.saved_at,
                   title: l.title, type: l.type, geo: l.geo, city: l.city,
                   tags: l.tags, is_premium: l.is_premium, provider_id: l.provider_id, status: l.status };
        }).filter(r => r.title); // only if listing still exists
        return { rows };
      }
      if (s.startsWith('DELETE')) {
        const userId = params[0], listingId = params[1];
        this.bookmarks = this.bookmarks.filter(b => !(b.user_id == userId && b.listing_id == listingId));
        return { rows: [] };
      }
    }

    return { rows: [] };
  }

  // Analytics helper (used by adminController)
  getAnalytics() {
    const byStatus = {};
    const byRole = {};
    this.listings.forEach(l => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });
    this.users.forEach(u => { byRole[u.role] = (byRole[u.role] || 0) + 1; });

    // Top providers by listing count
    const providerMap = {};
    this.listings.filter(l => l.status === 'active').forEach(l => {
      if (!providerMap[l.provider_id]) {
        const u = this.users.find(x => x.id == l.provider_id);
        providerMap[l.provider_id] = { name: u ? u.name : 'Unknown', listing_count: 0, total_views: 0, total_contacts: 0 };
      }
      providerMap[l.provider_id].listing_count++;
      providerMap[l.provider_id].total_views += (l.view_count || 0);
      providerMap[l.provider_id].total_contacts += (l.contact_count || 0);
    });

    // Recent activity: new listings last 7 days
    const actMap = {};
    const now = Date.now();
    this.listings.forEach(l => {
      const d = new Date(l.created_at);
      if (now - d.getTime() < 7 * 86400000) {
        const key = d.toISOString().slice(0, 10);
        actMap[key] = (actMap[key] || 0) + 1;
      }
    });

    return {
      listings: {
        total: this.listings.length,
        pending: byStatus['pending'] || 0,
        approvalRate: this.listings.length
          ? Math.round(((byStatus['active'] || 0) / this.listings.length) * 100) + '%'
          : '0%',
        byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count }))
      },
      users: {
        total: this.users.length,
        byRole: Object.entries(byRole).map(([role, count]) => ({ role, count }))
      },
      topProviders: Object.values(providerMap)
        .sort((a, b) => b.listing_count - a.listing_count)
        .slice(0, 10),
      recentActivity: Object.entries(actMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, new_listings]) => ({ date, new_listings })),
      notifications: [
        { type: 'pending_listings', count: byStatus['pending'] || 0 },
        { type: 'unread_messages', count: this.messages.filter(m => !m.read).length }
      ]
    };
  }
}

module.exports = new MockDatabase();
