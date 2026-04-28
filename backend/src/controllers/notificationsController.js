const db = require('../config/database');

// GET /api/notifications — last 30 notifications for current user
const getNotifications = async (req, res) => {
  try {
    const r = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );
    const unread = r.rows.filter(n => !n.read_at).length;
    res.json({ notifications: r.rows, unread });
  } catch (e) {
    console.error('getNotifications error:', e);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// PATCH /api/notifications/read-all — mark all as read
const markAllRead = async (req, res) => {
  try {
    await db.query(
      "UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL",
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (e) {
    console.error('markAllRead error:', e);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

// PATCH /api/notifications/:id/read — mark single as read
const markRead = async (req, res) => {
  try {
    await db.query(
      "UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

module.exports = { getNotifications, markAllRead, markRead };
