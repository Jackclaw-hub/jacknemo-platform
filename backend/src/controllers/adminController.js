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

module.exports = { getPendingListings, approveListing, rejectListing };
