const Listing = require('../models/Listing');
const pool = require('../config/database');

const getPendingListings = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const validStatuses = ['pending', 'active', 'rejected', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status filter' });
    }
    const listings = await Listing.findAll({ status });
    res.json({ listings, count: listings.length, filter: status });
  } catch (err) {
    console.error('getPendingListings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};

const approveListing = async (req, res) => {
  try {
    const listing = await Listing.updateStatus(req.params.id, 'active');
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json({ listing, message: 'Listing approved and now active' });
  } catch (err) {
    console.error('approveListing error:', err);
    res.status(500).json({ error: 'Failed to approve listing' });
  }
};

const rejectListing = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Rejection reason required' });
    const listing = await Listing.updateStatus(req.params.id, 'rejected', reason);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json({ listing, message: 'Listing rejected' });
  } catch (err) {
    console.error('rejectListing error:', err);
    res.status(500).json({ error: 'Failed to reject listing' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    // Use mock DB analytics helper if available, else compute from queries
    if (typeof pool.getAnalytics === 'function') {
      return res.json(pool.getAnalytics());
    }

    // Fallback for real PostgreSQL
    const [listingsRes, usersRes] = await Promise.all([
      pool.query('SELECT status, COUNT(*) FROM listings GROUP BY status'),
      pool.query('SELECT role, COUNT(*) FROM users GROUP BY role')
    ]);

    const byStatus = listingsRes.rows;
    const total = byStatus.reduce((s, r) => s + parseInt(r.count), 0);
    const pending = parseInt((byStatus.find(r => r.status === 'pending') || {}).count || 0);
    const active = parseInt((byStatus.find(r => r.status === 'active') || {}).count || 0);

    const topRes = await pool.query(`
      SELECT u.name, COUNT(l.id) as listing_count,
             COALESCE(SUM(l.view_count),0) as total_views,
             COALESCE(SUM(l.contact_count),0) as total_contacts
      FROM listings l JOIN users u ON u.id = l.provider_id
      WHERE l.status = 'active'
      GROUP BY u.id, u.name ORDER BY listing_count DESC LIMIT 10
    `);

    const actRes = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as new_listings
      FROM listings WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at) ORDER BY date
    `);

    res.json({
      listings: {
        total,
        pending,
        approvalRate: total ? Math.round((active / total) * 100) + '%' : '0%',
        byStatus
      },
      users: {
        total: usersRes.rows.reduce((s, r) => s + parseInt(r.count), 0),
        byRole: usersRes.rows
      },
      topProviders: topRes.rows,
      recentActivity: actRes.rows,
      notifications: [{ type: 'pending_listings', count: pending }]
    });
  } catch (err) {
    console.error('getAnalytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

module.exports = { getPendingListings, approveListing, rejectListing, getAnalytics };
