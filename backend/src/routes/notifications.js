const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getNotifications, markAllRead, markRead } = require('../controllers/notificationsController');

router.get('/', authenticateToken, getNotifications);
router.patch('/read-all', authenticateToken, markAllRead);
router.patch('/:id/read', authenticateToken, markRead);

module.exports = router;
