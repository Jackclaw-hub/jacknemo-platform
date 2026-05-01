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

// K-74: Weekly trends — last 8 weeks of signups + listings
const getTrends = async (req, res) => {
  try {
    // Build 8-week buckets (Sunday-based ISO weeks)
    const weeks = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const start = new Date(d);
      start.setDate(start.getDate() - start.getDay()); // Sunday
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      weeks.push({ start, end, label: start.toISOString().slice(0, 10) });
    }

    // For mock DB — compute from in-memory data
    if (typeof db.query !== 'function') {
      return res.json({ weeks: weeks.map(w => ({ week: w.label, new_users: 0, new_listings: 0 })) });
    }

    // Try mock-compatible approach: get all with created_at and bucket in JS
    const [users, listings] = await Promise.all([
      db.query('SELECT created_at FROM users'),
      db.query('SELECT created_at FROM listings'),
    ]);

    const trend = weeks.map(w => {
      const new_users = users.rows.filter(u => {
        const d = new Date(u.created_at);
        return d >= w.start && d < w.end;
      }).length;
      const new_listings = listings.rows.filter(l => {
        const d = new Date(l.created_at);
        return d >= w.start && d < w.end;
      }).length;
      return { week: w.label, new_users, new_listings };
    });

    res.json({ weeks: trend });
  } catch (err) {
    console.error('getTrends error:', err);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
};

// K-104: Top search terms
const getSearchTerms = async (req, res) => {
  try {
    const r = await db.query(
      `SELECT query, COUNT(*) as count FROM search_logs GROUP BY query ORDER BY count DESC LIMIT 20`
    );
    res.json({ terms: r.rows });
  } catch (err) {
    console.error('getSearchTerms error:', err);
    res.status(500).json({ error: 'Failed to fetch search terms' });
  }
};

module.exports = { getAnalytics, getTrends, getSearchTerms };
