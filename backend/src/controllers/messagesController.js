const pool = require('../config/database');

// POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { recipient_id, body, listing_id } = req.body;
    if (!recipient_id || !body || !body.trim()) {
      return res.status(400).json({ error: 'recipient_id and body are required' });
    }
    const result = await pool.query(
      'INSERT INTO messages (sender_id, recipient_id, listing_id, body, read, created_at) VALUES ($1,$2,$3,$4,false,NOW()) RETURNING *',
      [req.user.id, recipient_id, listing_id || null, body.trim()]
    );
    res.status(201).json({ message: result.rows[0] });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// GET /api/messages  — list thread summaries for current user
const getThreads = async (req, res) => {
  try {
    const uid = req.user.id;
    const { rows } = await pool.query(
      'SELECT * FROM messages WHERE sender_id = $1 OR recipient_id = $1',
      [uid]
    );

    // Build thread map: key = "otherId:listingId"
    const threadMap = {};
    rows.forEach(m => {
      const otherId = m.sender_id == uid ? m.recipient_id : m.sender_id;
      const key = `${otherId}:${m.listing_id || 'null'}`;
      if (!threadMap[key]) {
        threadMap[key] = {
          other_id: otherId,
          listing_id: m.listing_id || null,
          last_body: '',
          last_at: null,
          unread_count: 0,
          listing_title: null,
          other_name: null,
          other_email: null
        };
      }
      const t = threadMap[key];
      if (!t.last_at || new Date(m.created_at) > new Date(t.last_at)) {
        t.last_body = m.body;
        t.last_at = m.created_at;
      }
      if (m.recipient_id == uid && !m.read) t.unread_count++;
    });

    // Enrich with user info from mock DB
    const users = (await pool.query('SELECT * FROM users')).rows;
    const listings = (await pool.query('SELECT * FROM listings WHERE status = $1', ['active'])).rows;

    const threads = Object.values(threadMap).map(t => {
      const u = users.find(x => x.id == t.other_id);
      const l = t.listing_id ? listings.find(x => x.id == t.listing_id) : null;
      return {
        ...t,
        other_name: u ? u.name : null,
        other_email: u ? u.email : null,
        listing_title: l ? l.title : null
      };
    });

    threads.sort((a, b) => new Date(b.last_at) - new Date(a.last_at));
    res.json({ threads });
  } catch (err) {
    console.error('getThreads error:', err);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
};

// GET /api/messages/thread?otherUserId=x&listingId=y
const getThread = async (req, res) => {
  try {
    const uid = req.user.id;
    const { otherUserId, listingId } = req.query;
    if (!otherUserId) return res.status(400).json({ error: 'otherUserId required' });

    const result = await pool.query(
      `SELECT * FROM messages
       WHERE ((sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1))
       ${listingId ? 'AND listing_id = $3' : ''}
       ORDER BY created_at ASC`,
      listingId ? [uid, otherUserId, listingId] : [uid, otherUserId]
    );

    // Mark received messages as read
    await pool.query(
      'UPDATE messages SET read = true WHERE recipient_id = $1 AND sender_id = $2',
      [uid, otherUserId]
    );

    res.json({ messages: result.rows });
  } catch (err) {
    console.error('getThread error:', err);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
};

// GET /api/messages/unread
const getUnread = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE recipient_id = $1 AND read = false',
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) || 0 });
  } catch (err) {
    console.error('getUnread error:', err);
    res.status(500).json({ error: 'Failed to count unread' });
  }
};

module.exports = { sendMessage, getThreads, getThread, getUnread };

// PATCH /api/messages/:id/read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE messages SET read = true WHERE id = $1 AND recipient_id = $2 RETURNING id, read',
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

module.exports = { sendMessage, getThreads, getThread, getUnread, markAsRead };
