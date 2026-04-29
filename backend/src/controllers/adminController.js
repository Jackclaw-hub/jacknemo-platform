const Listing = require('../models/Listing');
const db = require('../config/database');
const { notifyListingApproved, notifyListingRejected } = require('../services/notificationService');
const sseService = require('../services/sseService');

async function getProviderEmail(providerId) {
  try {
    const res = await db.query('SELECT email FROM users WHERE id=$1', [providerId]);
    return res.rows[0]?.email || null;
  } catch(e) { return null; }
}

const getPendingListings = async (req, res) => {
  try {
    const listings = await Listing.findAll({ status: 'pending' });
    res.json({ listings, count: listings.length });
  } catch (err) {
    console.error('getPendingListings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};

// K-60: Get all listings with optional filters (admin)
const getAllListings = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    const db = require('../config/database');
    let sql = 'SELECT * FROM listings WHERE 1=1';
    const params = [];
    let idx = 1;
    if (status && status !== 'all') { sql += ` AND status = $${idx++}`; params.push(status); }
    if (type) { sql += ` AND type = $${idx++}`; params.push(type); }
    if (search && search.trim()) {
      sql += ` AND (LOWER(title) LIKE $${idx} OR LOWER(description) LIKE $${idx} OR LOWER(city) LIKE $${idx})`;
      params.push('%' + search.trim().toLowerCase() + '%');
      idx++;
    }
    sql += ' ORDER BY created_at DESC';
    const result = await db.query(sql, params);
    res.json({ listings: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('getAllListings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};

const approveListing = async (req, res) => {
  try {
    const listing = await Listing.updateStatus(req.params.id, 'approved');
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    // Emit SSE to provider in real-time
    sseService.emitToProvider(listing.provider_id, 'listing_approved', {
      listingId: listing.id,
      title: listing.title,
      status: 'approved',
    });

    getProviderEmail(listing.provider_id).then(email => {
      if (email) notifyListingApproved(listing, email).catch(console.error);
    });

    res.json({ listing, message: 'Listing approved' });
  } catch (err) {
    console.error('approveListing error:', err);
    res.status(500).json({ error: 'Failed to approve listing' });
  }
};

const rejectListing = async (req, res) => {
  try {
    const { reason } = req.body;
    const listing = await Listing.updateStatus(req.params.id, 'rejected', reason);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    // Emit SSE to provider in real-time
    sseService.emitToProvider(listing.provider_id, 'listing_rejected', {
      listingId: listing.id,
      title: listing.title,
      status: 'rejected',
      reason: reason || '',
    });

    getProviderEmail(listing.provider_id).then(email => {
      if (email) notifyListingRejected(listing, email, reason).catch(console.error);
    });

    res.json({ listing, message: 'Listing rejected' });
  } catch (err) {
    console.error('rejectListing error:', err);
    res.status(500).json({ error: 'Failed to reject listing' });
  }
};


const featureListing = async (req, res) => {
  try {
    const featuredUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const result = await db.query(
      'UPDATE listings SET is_featured=TRUE, featured_until=$1 WHERE id=$2 RETURNING *',
      [featuredUntil, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Listing not found' });
    res.json({ listing: result.rows[0], message: 'Listing featured until ' + featuredUntil.toDateString() });
  } catch (err) {
    console.error('featureListing error:', err);
    res.status(500).json({ error: 'Failed to feature listing' });
  }
};

const unfeatureListing = async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE listings SET is_featured=FALSE, featured_until=NULL WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Listing not found' });
    res.json({ listing: result.rows[0], message: 'Listing unfeatured' });
  } catch (err) {
    console.error('unfeatureListing error:', err);
    res.status(500).json({ error: 'Failed to unfeature listing' });
  }
};


// K-37: Providers pending verification
const getPendingVerification = async (req, res) => {
  try {
    const r = await db.query(
      `SELECT pp.user_id, pp.company_name, pp.contact_email, pp.verification_status,
              pp.verification_requested_at, u.email, u.name
         FROM provider_profiles pp
         JOIN users u ON u.id = pp.user_id
        WHERE pp.verification_status = 'pending'
        ORDER BY pp.verification_requested_at ASC`
    );
    res.json({ providers: r.rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch pending verifications' });
  }
};

// K-38: Admin view of expired premium listings
const getExpiredPremium = async (req, res) => {
  try {
    const r = await db.query(
      `SELECT id, title, is_premium, premium_expires_at
         FROM listings
        WHERE premium_expires_at IS NOT NULL
          AND premium_expires_at < $1
        ORDER BY premium_expires_at DESC
        LIMIT 50`,
      [new Date().toISOString()]
    );
    res.json({ listings: r.rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch expired premium listings' });
  }
};

// K-38: Manual trigger for premium expiry
const { revertExpiredPremium } = require('../jobs/premiumExpiry');
const runPremiumExpiry = async (req, res) => {
  const reverted = await revertExpiredPremium();
  res.json({ reverted: reverted.length, listings: reverted });
};


// K-55: Bulk approve/reject multiple pending listings
const bulkAction = async (req, res) => {
  const { ids, action, reason } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids array required' });
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'action must be approve or reject' });
  const db = require('../config/database');
  const { notifyListingApproved, notifyListingRejected } = require('../services/notificationService');
  const results = { succeeded: [], failed: [] };
  for (const id of ids) {
    try {
      const newStatus = action === 'approve' ? 'active' : 'rejected';
      const r = await db.query(
        action === 'approve'
          ? "UPDATE listings SET status='active', updated_at=NOW() WHERE id=$1 RETURNING *"
          : "UPDATE listings SET status='rejected', rejection_reason=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
        action === 'approve' ? [id] : [reason || '', id]
      );
      const listing = r.rows[0];
      if (listing) {
        results.succeeded.push(id);
        // Notify provider (fire-and-forget)
        try {
          const ur = await db.query('SELECT email FROM users WHERE id=$1', [listing.provider_id || listing.user_id]);
          const email = ur.rows[0]?.email;
          if (email) {
            if (action === 'approve') await notifyListingApproved(listing, email);
            else await notifyListingRejected(listing, email, reason);
          }
        } catch(ne) { /* notification optional */ }
      } else { results.failed.push(id); }
    } catch(e) { results.failed.push(id); }
  }
  res.json({ ...results, message: `${results.succeeded.length} ${action}d, ${results.failed.length} failed` });
};

module.exports = {
  bulkAction, getPendingListings, getAllListings, approveListing, rejectListing, featureListing, unfeatureListing, getPendingVerification, getExpiredPremium, runPremiumExpiry };