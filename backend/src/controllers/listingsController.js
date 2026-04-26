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
            starterFriendly, hourlyRate, dailyRate, fromPrice } = req.body;

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
      status: 'pending'
    });

    res.status(201).json({ listing, message: 'Listing created — pending moderation' });
  } catch (err) {
    console.error('createListing error:', err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
};

const getListings = async (req, res) => {
  try {
    const { type, geo, starterFriendly, search, status, premium } = req.query;

    if (search && search.trim()) {
      const listings = await Listing.search(search.trim());
      return res.json({ listings, count: listings.length });
    }

    const filters = { status: status || 'active' };
    if (type) filters.type = type;
    if (geo) filters.geo = geo;
    if (starterFriendly === 'true') filters.starterFriendly = true;
    if (premium === 'true') filters.is_premium = true;

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

module.exports = { createListing, getListings, getListing, contactListing, updateListing, deleteListing, getMyListings, promoteListing, demoteListing };
