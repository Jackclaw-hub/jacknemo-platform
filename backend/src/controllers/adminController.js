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
    sseService.emitToProvider(listing.provider_id, 'listing_approved', { listingId: listing.id, title: listing.title, status: 'approved' });
    const email = await getProviderEmail(listing.provider_id);
    if (email) await notifyListingApproved(listing, email);
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
    sseService.emitToProvider(listing.provider_id, 'listing_rejected', { listingId: listing.id, title: listing.title, status: 'rejected', reason: reason || '' });
    const email = await getProviderEmail(listing.provider_id);
    if (email) await notifyListingRejected(listing, email, reason);
    res.json({ listing, message: 'Listing rejected' });
  } catch (err) {
    console.error('rejectListing error:', err);
    res.status(500).json({ error: 'Failed to reject listing' });
  }
};

const featureListing = async (req, res) => {
  try {
    const featuredUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const result = await db.query('UPDATE listings SET is_featured=TRUE, featured_until=$1 WHERE id=$2 RETURNING *', [featuredUntil, req.params.id]);
    if (!result.rows.length) return res.status(404