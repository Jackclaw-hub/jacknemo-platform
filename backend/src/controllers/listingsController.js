const Listing = require('../models/Listing');
const db = require('../config/database');
const { notifyContactReceived } = require('../services/notificationService');

const PROVIDER_ROLES = ['equipment_provider', 'service_provider'];
const VALID_GEO = ['local', 'regional', 'national', 'remote', 'global'];
const VALID_TYPES = ['equipment', 'service'];

const createListing = async (req, res) => {
  try {
    if (!PROVIDER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only equipment or service providers can create listings' });
    }

    const { type, title, description, geo, city, tags, stages, sectors,
            starterFriendly, hourlyRate, dailyRate, fromPrice, imageUrl } = req.body;

    if (!type || !title || !geo) {
      return res.status(400).json({ error: 'Missing required fields: type, title, geo' });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: 'type must be equipment or service' });
    }
    if (!VALID_GEO.includes(geo)) {
      return res.status(400).json({ error: `geo must be one of: ${VALID_GEO.join(', ')}` });
    }

    const listing = await Listing.create({
      type, title, description: description || '',
      providerId: req.user.id, providerRole: req.user.role,
      geo, city: city || null,
      tags: tags || [], stages: stages || [], sectors: sectors || [],
      starterFriendly: Boolean(starterFriendly),
      hourlyRate: hourlyRate || null, dailyRate: dailyRate || null, fromPrice: fromPrice || null,
      status: req.body.draft ? 'draft' : 'pending',
      imageUrl: imageUrl || null
    });

    const msg = listing.status === 'draft'
      ? 'Draft saved — publish when ready'
      : 'Listing created — pending moderation';
    res.status(201).json({ listing, message: msg });
  } catch (err) {
    console.error('createListing error:', err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
};

const getListings = async (req, res) => {
  try {
    const { type, geo, starterFriendly, search, status, premium, tags } = req.query;

    if (search && search.trim()) {
      const q = search.trim();
      // K-104: Log search query (fire-and-forget)
      db.query('INSERT INTO search_logs (query, created_at) VALUES ($1, NOW())', [q.slice(0, 100)]).catch(() => {});
      const listings = await Listing.search(q);
      return res.json({ listings, count: listings.length });
    }

    const filters = { status: status || 'active' };
    if (type) filters.type = type;
    if (geo) filters.geo = geo;
    if (starterFriendly === 'true') filters.starterFriendly = true;
    if (premium === 'true') filters.is_premium = true;
    if (tags) filters.tags = tags;

    let listings = await Listing.findAll(filters);
    // K-81: Attach provider_verified flag
    try {
      const profilesRes = await db.query('SELECT user_id, is_verified FROM provider_profiles');
      const verifiedMap = {};
      for (const row of profilesRes.rows) verifiedMap[String(row.user_id)] = !!row.is_verified;
      listings = listings.map(l => ({ ...l, provider_verified: verifiedMap[String(l.provider_id)] || false }));
    } catch(e) { /* provider_verified optional */ }
    res.json({ listings, count: listings.length });
  } catch (err) {
    console.error('getListings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};

const getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    // K-69: view counting moved to POST /:id/view (session-deduplicated)
    res.json({ listing });
  } catch (err) {
    console.error('getListing error:', err);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
};

// K-140: Public stats endpoint
const getListingStats = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json({
      id: listing.id,
      view_count:    listing.view_count    || 0,
      contact_count: listing.contact_count || 0,
      is_premium:    listing.is_premium    || false,
      is_featured:   listing.is_featured   || false,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// K-120: in-memory view dedup store — key: "ip:listingId", value: timestamp
const _viewSeen = new Map();
const VIEW_TTL = 60 * 60 * 1000; // 1 hour
// Prune stale entries every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - VIEW_TTL;
  for (const [k, ts] of _viewSeen) { if (ts < cutoff) _viewSeen.delete(k); }
}, 10 * 60 * 1000).unref();

// K-69: Explicit view event — called by frontend once per session
const recordView = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    // K-120: deduplicate — skip increment if same IP viewed this listing within TTL
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const key = ip + ':' + req.params.id;
    const lastSeen = _viewSeen.get(key);
    if (!lastSeen || Date.now() - lastSeen > VIEW_TTL) {
      _viewSeen.set(key, Date.now());
      Listing.incrementView(req.params.id).catch(() => {});
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record view' });
  }
};

const contactListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    Listing.incrementContact(req.params.id).catch(() => {});

    // K-59: Send email notification to provider (fire-and-forget)
    const senderName = req.user?.name || req.user?.email || 'Ein Gründer';
    const message = req.body?.message || '';
    const subject = req.body?.subject || '';
    notifyContactReceived(listing, listing.provider_id, senderName, message, subject).catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    console.error('contactListing error:', err);
    res.status(500).json({ error: 'Failed to record contact' });
  }
};

const updateListing = async (req, res) => {
  try {
    if (!PROVIDER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only providers can update listings' });
    }
    const listing = await Listing.update(req.params.id, req.user.id, req.body);
    if (!listing) return res.status(404).json({ error: 'Listing not found or not owned by you' });
    res.json({ listing, message: 'Listing updated' });
  } catch (err) {
    console.error('updateListing error:', err);
    res.status(500).json({ error: 'Failed to update listing' });
  }
};

const deleteListing = async (req, res) => {
  try {
    if (!PROVIDER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only providers can delete listings' });
    }
    const deleted = await Listing.delete(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Listing not found or not owned by you' });
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    console.error('deleteListing error:', err);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
};

// K-134: Partial tag update for a listing
const updateListingTags = async (req, res) => {
  try {
    if (!PROVIDER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only providers can update listings' });
    }
    const { tags } = req.body;
    if (!Array.isArray(tags)) return res.status(400).json({ error: 'tags must be an array' });
    const db = require('../config/database');
    const check = await db.query('SELECT id, provider_id FROM listings WHERE id = $1', [req.params.id]);
    const listing = check.rows[0];
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (String(listing.provider_id) !== String(req.user.id)) return res.status(403).json({ error: 'Not your listing' });
    const r = await db.query(
      'UPDATE listings SET tags = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify(tags), req.params.id]
    );
    res.json({ listing: r.rows[0], message: 'Tags updated' });
  } catch (err) {
    console.error('updateListingTags error:', err);
    res.status(500).json({ error: 'Failed to update tags' });
  }
};

const getMyListings = async (req, res) => {
  try {
    if (!PROVIDER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only providers have listings' });
    }
    const listings = await Listing.findByProvider(req.user.id);
    res.json({ listings, count: listings.length });
  } catch (err) {
    console.error('getMyListings error:', err);
    res.status(500).json({ error: 'Failed to fetch your listings' });
  }
};


// K-20: Premium Listings — admin can promote/demote
const promoteListing = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const duration_days = parseInt(req.body.duration_days) || 30;
    const listing = await Listing.setPremium(req.params.id, true, duration_days);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json({ listing, message: `Promoted to premium for ${duration_days} days` });
  } catch (err) {
    console.error('promoteListing error:', err);
    res.status(500).json({ error: 'Failed to promote listing' });
  }
};

const demoteListing = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const listing = await Listing.setPremium(req.params.id, false, 0);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json({ listing, message: 'Premium status removed' });
  } catch (err) {
    console.error('demoteListing error:', err);
    res.status(500).json({ error: 'Failed to demote listing' });
  }
};

// K-43: Publish a draft listing (status: draft → pending for moderation)
const publishListing = async (req, res) => {
  try {
    if (!PROVIDER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only providers can publish listings' });
    }
    const db = require('../config/database');
    const r = await db.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);
    const listing = r.rows[0];
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.provider_id != req.user.id) return res.status(403).json({ error: 'Not your listing' });
    if (listing.status !== 'draft') return res.status(409).json({ error: 'Only draft listings can be published' });

    const upd = await db.query(
      "UPDATE listings SET status = 'pending', updated_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    res.json({ listing: upd.rows[0], message: 'Listing submitted for moderation' });
  } catch (err) {
    console.error('publishListing error:', err);
    res.status(500).json({ error: 'Failed to publish listing' });
  }
};

// K-103 / K-153: Pause an active listing (active → paused) — provider only
const pauseListing = async (req, res) => {
  try {
    if (!PROVIDER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only providers can pause listings' });
    }
    const db = require('../config/database');
    const r = await db.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);
    const listing = r.rows[0];
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.provider_id != req.user.id) return res.status(403).json({ error: 'Not your listing' });
    if (listing.status !== 'active') return res.status(409).json({ error: 'Only active listings can be paused' });
    const upd = await db.query(
      "UPDATE listings SET status = 'paused', updated_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    res.json({ listing: upd.rows[0], message: 'Listing paused' });
  } catch (err) {
    console.error('pauseListing error:', err);
    res.status(500).json({ error: 'Failed to pause listing' });
  }
};

// K-153: Resume a paused listing (paused → active) — provider only
const resumeListing = async (req, res) => {
  try {
    if (!PROVIDER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only providers can resume listings' });
    }
    const db = require('../config/database');
    const r = await db.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);
    const listing = r.rows[0];
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.provider_id != req.user.id) return res.status(403).json({ error: 'Not your listing' });
    if (listing.status !== 'paused') return res.status(409).json({ error: 'Only paused listings can be resumed' });
    const upd = await db.query(
      "UPDATE listings SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    res.json({ listing: upd.rows[0], message: 'Listing resumed' });
  } catch (err) {
    console.error('resumeListing error:', err);
    res.status(500).json({ error: 'Failed to resume listing' });
  }
};

// K-56: Renew a listing — provider extends expiry by 90 days (reactivates expired)
const renewListing = async (req, res) => {
  try {
    if (!PROVIDER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only providers can renew listings' });
    }
    const listing = await Listing.renew(req.params.id, req.user.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found, not owned by you, or not renewable' });
    res.json({ listing, message: 'Listing renewed — active for another 90 days' });
  } catch (err) {
    console.error('renewListing error:', err);
    res.status(500).json({ error: 'Failed to renew listing' });
  }
};

// K-56: Admin endpoint — expire stale listings
const runListingExpiry = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const expired = await Listing.expireOldListings();
    res.json({ expired_ids: expired, count: expired.length, message: `${expired.length} listing(s) expired` });
  } catch (err) {
    console.error('runListingExpiry error:', err);
    res.status(500).json({ error: 'Failed to run expiry' });
  }
};

// K-73: Duplicate a listing as a draft
const duplicateListing = async (req, res) => {
  try {
    const copy = await Listing.duplicate(req.params.id, req.user.id);
    if (!copy) return res.status(404).json({ error: 'Listing not found or not owned by you' });
    res.status(201).json({ listing: copy, message: 'Kopie als Entwurf erstellt' });
  } catch (err) {
    console.error('duplicateListing error:', err);
    res.status(500).json({ error: 'Failed to duplicate listing' });
  }
};

// K-88: Search autocomplete — return up to 6 matching active listing titles + tags
const suggestListings = async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    if (!q || q.length < 2) return res.json({ suggestions: [] });
    const all = await Listing.findAll({});
    const active = all.filter(l => l.status === 'active');
    const seen = new Set();
    const results = [];
    for (const l of active) {
      if (results.length >= 6) break;
      const titleMatch = (l.title || '').toLowerCase().includes(q);
      if (titleMatch && !seen.has(l.title)) {
        seen.add(l.title);
        results.push({ id: l.id, label: l.title, type: 'listing' });
      }
    }
    // Also match tags
    for (const l of active) {
      if (results.length >= 6) break;
      for (const tag of (l.tags || [])) {
        if (tag.toLowerCase().includes(q) && !seen.has(tag)) {
          seen.add(tag);
          results.push({ id: null, label: tag, type: 'tag' });
        }
      }
    }
    res.json({ suggestions: results.slice(0, 6) });
  } catch (err) {
    res.status(500).json({ error: 'Suggest failed', suggestions: [] });
  }
};

// K-100: Related listings — up to 4 active listings of same type, excluding current
const getRelatedListings = async (req, res) => {
  try {
    const id = req.params.id;
    const current = await Listing.findById(id);
    if (!current) return res.status(404).json({ error: 'Listing not found' });
    const all = await Listing.findAll({});
    const related = all
      .filter(l => l.status === 'active' && String(l.id) !== String(id) && l.type === current.type)
      .slice(0, 4)
      .map(l => ({ id: l.id, title: l.title, type: l.type, city: l.city, geo: l.geo, view_count: l.view_count }));
    res.json({ related });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch related listings', related: [] });
  }
};

// K-131: Get single owned listing for authenticated provider
const getMyListingById = async (req, res) => {
  try {
    if (!PROVIDER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only providers have listings' });
    }
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (String(listing.provider_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Not your listing' });
    }
    res.json({ listing });
  } catch (err) {
    console.error('getMyListingById error:', err);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
};

module.exports = { createListing, getListings, getListing, contactListing, updateListing, deleteListing, getMyListings, getMyListingById, updateListingTags, getListingStats, promoteListing, demoteListing, publishListing, pauseListing, resumeListing, renewListing, runListingExpiry, recordView, duplicateListing, suggestListings, getRelatedListings };
