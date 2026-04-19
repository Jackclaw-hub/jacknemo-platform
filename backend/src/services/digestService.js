const db = require('../config/database');
const { scoreListingsForFounder } = require('./radarScoring');
const { notifyHighScoreMatch } = require('./notificationService');

/**
 * Send weekly top-5 matches digest to all founders with profiles
 */
async function sendWeeklyDigest() {
  console.log('[Digest] Starting weekly digest run...');
  try {
    // Get all founders who have saved profiles
    const foundersRes = await db.query(`
      SELECT u.id, u.email, u.name,
             fp.stage, fp.sector, fp.geo, fp.city
      FROM users u
      JOIN founder_profiles fp ON fp.user_id = u.id
      WHERE u.role = 'founder'
    `);

    const founders = foundersRes.rows;
    console.log('[Digest] Processing', founders.length, 'founders');

    if (!founders.length) return;

    // Get all approved listings (with featured + ratings preloaded)
    const listingsRes = await db.query(`
      SELECT l.*,
             COALESCE(AVG(pr.rating), 0) as "avgRating",
             COUNT(pr.id) as "ratingCount"
      FROM listings l
      LEFT JOIN provider_ratings pr ON pr.provider_id = l.provider_id
      WHERE l.status = 'approved'
      GROUP BY l.id
    `);
    const listings = listingsRes.rows.map(l => ({
      ...l,
      avgRating: parseFloat(l.avgRating) || 0,
      ratingCount: parseInt(l.ratingCount) || 0,
    }));

    for (const founder of founders) {
      try {
        const scored = scoreListingsForFounder(founder, listings, 0.3);
        const top5 = scored.slice(0, 5);

        if (!top5.length) {
          console.log('[Digest] No matches for founder', founder.email, '— skipping');
          continue;
        }

        // Send via notificationService
        await notifyHighScoreMatch(top5[0], founder.email, top5);
        console.log('[Digest] Sent digest to', founder.email, 'with', top5.length, 'matches');
      } catch (err) {
        console.error('[Digest] Error for founder', founder.email, ':', err.message);
      }
    }

    console.log('[Digest] Weekly digest complete');
  } catch (err) {
    console.error('[Digest] Fatal error:', err);
  }
}

module.exports = { sendWeeklyDigest };
