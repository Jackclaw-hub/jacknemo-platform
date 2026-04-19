const Listing = require('../models/Listing');

const PROVIDER_ROLES = ['equipment_provider', 'service_provider'];

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

    const validTypes = ['equipment', 'service'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'type must be equipment or service' });
    }

    const validGeo = ['regional', 'remote', 'global'];
    if (!validGeo.includes(geo)) {
      return res.status(400).json({ error: 'geo must be regional, remote, or global' });
    }

    // Role-type consistency check
    if (type === 'equipment' && req.user.role !== 'equipment_provider') {
      return res.status(403).json({ error: 'Only equipment_providers can create equipment listings' });
    }
    if (type === 'service' && req.user.role !== 'service_provider') {
      return res.status(403).json({ error: 'Only service_providers can create service listings' });
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
    const { type, geo, starterFriendly } = req.query;
    const filters = {};
    if (type) filters.type = type;
    if (geo) filters.geo = geo;
    if (starterFriendly === 'true') filters.starterFriendly = true;

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
    res.json({ listing });
  } catch (err) {
    console.error('getListing error:', err);
    res.status(500).json({ error: 'Failed to fetch listing' });
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

module.exports = { createListing, getListings, getListing, updateListing, deleteListing, getMyListings };
