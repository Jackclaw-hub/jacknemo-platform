const FounderProfile = require('../models/FounderProfile');

async function upsertProfile(req, res) {
  try {
    const profile = await FounderProfile.upsert(req.user.id, req.body);
    res.json({ profile });
  } catch (err) {
    console.error('upsertProfile error:', err.message);
    res.status(500).json({ error: 'Failed to save founder profile' });
  }
}
async function getProfile(req, res) {
  try {
    const profile = await FounderProfile.findByUserId(req.user.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
}
module.exports = { upsertProfile, getProfile };
