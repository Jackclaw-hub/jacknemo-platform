const express = require('express');
const router = express.Router();
const { sendMessage, getThreads, getThread, getUnreadCount } = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, sendMessage);
router.get('/', authenticateToken, getThreads);
router.get('/thread', authenticateToken, getThread);
router.get('/unread', authenticateToken, getUnreadCount);

module.exports = router;
