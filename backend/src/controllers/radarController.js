const Listing = require('../models/Listing');
const { scoreListingsForFounder } = require('../services/radarScoring');

/**
 * GET /api/radar
 * Returns personalized scored listings for the authenticated founder.
 * Query params: type (equipment|service|all), threshold (0-1)
 */
const getRadar = async (req, res) => {
  try {
    if (req.user.role !== 'founder') {
      return res.status(403).json({ error: 'Radar is only available to founders' });
    }

    const { type, threshold } = req.query;
    const minScore = parseFloat(threshold) || 0.2;

    // Build founder profile from user record + query params
    const founder = {
      stage:  req.query.stage  || req.user.stage  || 'seed',
      sector: req.query.sector || req.user.sector || '',
      geo:    req.query.geo    || req.user.geo    || 'remote',
      city:   req.query.city   || req.user.city   || null,
    };

    // Fetch active listings
    const filters = { status: 'active' };
    if (type && type !== 'all') filters.type = type;
    const listings = await Listing.findAll(filters);

    // Score and rank
    const radarResults = scoreListingsForFounder(founder, listings, minScore);

    res.json({
      founder,
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
