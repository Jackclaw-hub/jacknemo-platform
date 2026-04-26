const db = require("../config/database");

// GET /api/admin/analytics — admin only
const getAnalytics = async (req, res) => {
  try {
    // Mock DB exposes getAnalytics() directly; real PG uses queries
    if (typeof db.getAnalytics === "function") {
      return res.json(db.getAnalytics());
    }
    // PostgreSQL path
    const [listingStats, userStats, topProviders, recentActivity, notifStats] = await Promise.all([
      db.query("SELECT status, COUNT(*) as count FROM listings GROUP BY status ORDER BY count DESC"),
      db.query("SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC"),
      db.query(`
        SELECT u.name, u.email, COUNT(l.id) as listing_count,
               COALESCE(SUM(l.view_count),0) as total_views,
               COALESCE(SUM(l.contact_count),0) as total_contacts
        FROM users u JOIN listings l ON l.provider_id = u.id
        WHERE u.role IN ('equipment_provider','service_provider')
        GROUP BY u.id, u.name, u.email ORDER BY listing_count DESC LIMIT 10
      `),
      db.query(`SELECT DATE(created_at) as date, COUNT(*) as new_listings FROM listings WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY date DESC`),
      db.query("SELECT type, COUNT(*) as count FROM notifications GROUP BY type ORDER BY count DESC"),
    ]);
    const total = listingStats.rows.reduce((s, r) => s + parseInt(r.count), 0);
    const approved = listingStats.rows.find(r => r.status === "approved" || r.status === "active")?.count || 0;
    res.json({
      listings: { total, byStatus: listingStats.rows, approvalRate: total ? Math.round(approved / total * 100) + "%" : "0%", pending: listingStats.rows.find(r => r.status === "pending")?.count || 0 },
      users: { byRole: userStats.rows, total: userStats.rows.reduce((s, r) => s + parseInt(r.count), 0) },
      topProviders: topProviders.rows,
      recentActivity: recentActivity.rows,
      notifications: notifStats.rows,
    });
  } catch (err) {
    console.error("getAnalytics error:", err.message);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

module.exports = { getAnalytics };
