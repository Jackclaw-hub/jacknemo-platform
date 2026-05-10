const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getBookmarks } = require('../controllers/bookmarksController');

router.get('/', authenticateToken, getBookmarks);

module.exports = router;
