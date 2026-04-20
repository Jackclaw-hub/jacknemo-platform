const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { sendMessage, getThreads, getThread, getUnread } = require('../controllers/messagesController');

router.use(authenticateToken);

router.get('/', getThreads);
router.post('/', sendMessage);
router.get('/unread', getUnread);
router.get('/thread', getThread);

module.exports = router;
