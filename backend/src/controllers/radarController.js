const Listing = require('../models/Listing');
const FounderProfile = require('../models/FounderProfile');
const { scoreListingsForFounder } = require('../services/radarScoring');

/**
 * GET /api/radar
 * Returns personalized scored listings for the authenticated founder.
 * Loads founder profile from DB; query params override profile values.
 */
const getRadar = async (req, res) => {
  try {
    if (req.user.role !== 'founder') {
      return res.status(403).json({ error: 'Radar is only available to founders' });
    }

    const { type, threshold } = req.query;
    const minScore = parseFloat(threshold) || 0.2;

    // Load saved founder profile (if exists)
    let savedProfile = null;
    try { savedProfile = await FounderProfile.findByUserId(req.user.id); } catch(e) {}

    // Query params override profile (allows filter UI to work)
    const founder = {
      stage:  req.query.stage  || savedProfile?.stage  || 'seed',
      sector: req.query.sector || savedProfile?.sector || '',
      geo:    req.query.geo    || savedProfile?.geo    || 'national',
      city:   req.query.city   || savedProfile?.city   || null,
    };

    // Fetch approved/active listings
    const filters = { status: 'approved' };
    if (type && type !== 'all') filters.type = type;
    let listings = await Listing.findAll(filters);
    // Also include active status listings
    if (!listings.length) {
      listings = await Listing.findAll({ status: 'active' });
    }

    // Score and rank
    const radarResults = scoreListingsForFounder(founder, listings, minScore);

    res.json({
      founder,
      has_profile: !!savedProfile,
      threshold: minScore,
      total: radarResults.length,
      listings: radarResults
    });
  } catch (err) {
    console.error('getRadar error:', err);
    res.status(500).json({ error: 'Failed to calculate radar' });
  }
};

module.exports = { getRadar };
