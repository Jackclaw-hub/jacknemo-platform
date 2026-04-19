const db = require('../config/database');

// GET /api/admin/analytics — admin only
const getAnalytics = async (req, res) => {
  try {
    const [
      listingStats, userStats, topProviders, recentActivity, notifStats
    ] = await Promise.all([
      // Listing breakdown by status
      db.query(`SELECT status, COUNT(*) as count FROM listings GROUP BY status ORDER BY count DESC`),
      // User breakdown by role
      db.query(`SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC`),
      // Top providers by listing count + engagement
      db.query(`
        SELECT u.name, u.email, COUNT(l.id) as listing_count,
               COALESCE(SUM(l.view_count),0) as total_views,
               COALESCE(SUM(l.contact_count),0) as total_contacts
        FROM users u
        JOIN listings l ON l.provider_id = u.id
        WHERE u.role IN ('equipment_provider','service_provider')
        GROUP BY u.id, u.name, u.email
        ORDER BY listing_count DESC
        LIMIT 10
      `),
      // Recent listing activity (last 7 days)
      db.query(`
        SELECT DATE(created_at) as date, COUNT(*) as new_listings
        FROM listings
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `),
      // Notification summary
      db.query(`SELECT type, COUNT(*) as count FROM notifications GROUP BY type ORDER BY count DESC`),
    ]);

    const totalListings = listingStats.rows.reduce((s, r) => s + parseInt(r.count), 0);
    const approved = listingStats.rows.find(r => r.status === 'approved' || r.status === 'active')?.count || 0;
    const pending = listingStats.rows.find(r => r.status === 'pending')?.count || 0;

    res.json({
      listings: {
        total: totalListings,
        byStatus: listingStats.rows,
        approvalRate: totalListings ? Math.round((approved / totalListings) * 100) + '%' : '0%',
        pending,
      },
      users: {
        byRole: userStats.rows,
        total: userStats.rows.reduce((s, r) => s + parseInt(r.count), 0),
      },
      topProviders: topProviders.rows,
      recentActivity: recentActivity.rows,
      notifications: notifStats.rows,
    });
  } catch(err) {
    console.error('getAnalytics error:', err.message);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

module.exports = { getAnalytics };
