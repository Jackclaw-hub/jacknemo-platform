const Listing = require('../models/Listing');

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
      const listings = await Listing.search(search.trim());
      return res.json({ listings, count: listings.length });
    }

    const filters = { status: status || 'active' };
    if (type) filters.type = type;
    if (geo) filters.geo = geo;
    if (starterFriendly === 'true') filters.starterFriendly = true;
    if (premium === 'true') filters.is_premium = true;
    if (tags) filters.tags = tags;

    const listings = await Listing.findAll(filters);
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
    // Increment view count (fire-and-forget, don't block response)
    Listing.incrementView(req.params.id).catch(() => {});
    res.json({ listing });
  } catch (err) {
    console.error('getListing error:', err);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
};

const contactListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    Listing.incrementContact(req.params.id).catch(() => {});
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

module.exports = { createListing, getListings, getListing, contactListing, updateListing, deleteListing, getMyListings, promoteListing, demoteListing, publishListing, renewListing, runListingExpiry };
