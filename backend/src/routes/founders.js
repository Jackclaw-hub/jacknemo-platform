const express = require('express');
const router = express.Router();
const { upsertProfile, getProfile } = require('../controllers/founderController');

router.post('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;
    const profile = await upsertProfile(userId, data);
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error upserting profile' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await getProfile(userId);
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error getting profile' });
  }
});

module.exports = router;