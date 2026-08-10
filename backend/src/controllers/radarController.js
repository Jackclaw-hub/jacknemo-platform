const Listing = require('../models/Listing');
const db = require('../config/database');
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

    // Attach provider avg ratings (for KAN-022 reputation bonus)
    try {
      const providerIds = [...new Set(listings.map(l => l.provider_id).filter(Boolean))];
      if (providerIds.length) {
        const ratingsRes = await db.query(
          `SELECT provider_id, ROUND(AVG(rating)::numeric,1) as avg_rating, COUNT(*) as rating_count
           FROM provider_ratings WHERE provider_id = ANY($1::uuid[]) GROUP BY provider_id`,
          [providerIds]
        );
        const ratingsMap = {};
        for (const row of ratingsRes.rows) {
          ratingsMap[row.provider_id] = { avg: parseFloat(row.avg_rating), count: parseInt(row.rating_count) };
        }
        listings = listings.map(l => ({
          ...l,
          avgRating: ratingsMap[l.provider_id]?.avg || 0,
          ratingCount: ratingsMap[l.provider_id]?.count || 0,
        }));
      }
    } catch(e) { /* ratings optional */ }

    // K-81: Attach provider_verified flag from provider_profiles
    try {
      const profilesRes = await db.query('SELECT user_id, is_verified FROM provider_profiles');
      const verifiedMap = {};
      for (const row of profilesRes.rows) verifiedMap[String(row.user_id)] = !!row.is_verified;
      listings = listings.map(l => ({ ...l, provider_verified: verifiedMap[String(l.provider_id)] || false }));
    } catch(e) { /* provider_verified optional */ }

    // Score and rank
    const radarResults = scoreListingsForFounder(founder, listings, minScore);

    // K-171: pagination
    const limitVal = Math.min(parseInt(req.query.limit) || 20, 100);
    const offsetVal = parseInt(req.query.offset) || 0;
    const page = radarResults.slice(offsetVal, offsetVal + limitVal);

    res.json({
      founder,
      has_profile: !!savedProfile,
      threshold: minScore,
      total: radarResults.length,
      offset: offsetVal,
      has_more: offsetVal + limitVal < radarResults.length,
      listings: page
    });
  } catch (err) {
    console.error('getRadar error:', err);
    res.status(500).json({ error: 'Failed to calculate radar' });
  }
};

module.exports = { getRadar };
