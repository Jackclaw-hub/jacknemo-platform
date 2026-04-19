const Listing = require('../models/Listing');

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

module.exports = { getPendingListings, approveListing, rejectListing };
