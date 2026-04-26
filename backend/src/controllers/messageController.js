const db = require('../config/database');
const sseService = require('../services/sseService');
const { notifyContactReceived } = require("../services/notificationService");

const sendMessage = async (req, res) => {
  try {
    const { listing_id, recipient_id, body } = req.body;
    if (!recipient_id || !body?.trim()) {
      return res.status(400).json({ error: 'recipient_id and body required' });
    }
    const result = await db.query(
      `INSERT INTO messages (listing_id, sender_id, recipient_id, body)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [listing_id || null, req.user.id, recipient_id, body.trim()]
    );
    const msg = result.rows[0];

    // Real-time notification via SSE
    sseService.emitToProvider(recipient_id, 'new_message', {
      messageId: msg.id,
      senderId: req.user.id,
      listingId: listing_id,
      preview: body.trim().slice(0, 80),
    });

    // K-21: Email notify provider of new contact
    if (listing_id) {
      db.query("SELECT * FROM listings WHERE id = \\", [listing_id]).then(lr=>{
        const l = lr.rows[0];
        if (l) notifyContactReceived(l, recipient_id, req.user.name||req.user.email, body.trim().slice(0,200)).catch(console.error);
      }).catch(()=>{});
    }
        res.status(201).json({ message: msg });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

const getThreads = async (req, res) => {
  try {
    // Get latest message per thread (grouped by listing + other party)
    const result = await db.query(
      `SELECT DISTINCT ON (listing_id, other_id)
         m.listing_id, m.id as last_message_id, m.body as last_body,
         m.created_at as last_at, m.is_read,
         CASE WHEN m.sender_id=$1 THEN m.recipient_id ELSE m.sender_id END as other_id,
         u.name as other_name, u.email as other_email, u.role as other_role,
         l.title as listing_title,
         (SELECT COUNT(*) FROM messages m2
          WHERE m2.recipient_id=$1 AND m2.is_read=FALSE
            AND m2.listing_id IS NOT DISTINCT FROM m.listing_id
            AND m2.sender_id = CASE WHEN m.sender_id=$1 THEN m.recipient_id ELSE m.sender_id END
         ) as unread_count
       FROM messages m
       JOIN users u ON u.id = CASE WHEN m.sender_id=$1 THEN m.recipient_id ELSE m.sender_id END
       LEFT JOIN listings l ON l.id = m.listing_id
       WHERE m.sender_id=$1 OR m.recipient_id=$1
       ORDER BY listing_id, other_id, last_at DESC`,
      [req.user.id]
    );
    res.json({ threads: result.rows });
  } catch (err) {
    console.error('getThreads error:', err);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
};

const getThread = async (req, res) => {
  try {
    const { otherUserId, listingId } = req.query;
    if (!otherUserId) return res.status(400).json({ error: 'otherUserId required' });

    const result = await db.query(
      `SELECT m.*, u.name as sender_name FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id=$1 AND m.recipient_id=$2) OR (m.sender_id=$2 AND m.recipient_id=$1)
       ${listingId ? 'AND m.listing_id=$3' : ''}
       ORDER BY m.created_at ASC`,
      listingId ? [req.user.id, otherUserId, listingId] : [req.user.id, otherUserId]
    );

    // Mark as read
    await db.query(
      'UPDATE messages SET is_read=TRUE WHERE recipient_id=$1 AND sender_id=$2 AND is_read=FALSE',
      [req.user.id, otherUserId]
    );

    res.json({ messages: result.rows });
  } catch (err) {
    console.error('getThread error:', err);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM messages WHERE recipient_id=$1 AND is_read=FALSE',
      [req.user.id]
    );
    res.json({ unread: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'UPDATE messages SET is_read=TRUE WHERE id=$1 AND recipient_id=$2 RETURNING id, is_read',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found or not authorized' });
    }
    res.json({ message: result.rows[0] });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

module.exports = { sendMessage, getThreads, getThread, getUnreadCount, markAsRead };
