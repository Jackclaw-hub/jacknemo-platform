
const pool = require('../config/db'); // Assuming db connection is in config/db

const getBookmarks = async (req, res) => {
  try {
    const { user_id } = req.user; // Assuming user_id is available from authentication middleware
    const { rows } = await pool.query(
      'SELECT l.* FROM bookmarks b JOIN listings l ON l.id = b.listing_id WHERE b.user_id = $1',
      [user_id]
    );
    res.json({ bookmarks: rows });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleBookmark = async (req, res) => {
  try {
    const { user_id } = req.user; // Assuming user_id is available from authentication middleware
    const { id } = req.params; // Listing ID
    const listing_id = id;

    const existingBookmark = await pool.query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND listing_id = $2',
      [user_id, listing_id]
    );

    if (existingBookmark.rows.length > 0) {
      // Bookmark exists, delete it
      await pool.query(
        'DELETE FROM bookmarks WHERE user_id = $1 AND listing_id = $2',
        [user_id, listing_id]
      );
      res.json({ bookmarked: false, message: 'Bookmark removed' });
    } else {
      // Bookmark does not exist, insert it
      await pool.query(
        'INSERT INTO bookmarks (user_id, listing_id) VALUES ($1, $2)',
        [user_id, listing_id]
      );
      res.json({ bookmarked: true, message: 'Bookmark added' });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getBookmarks,
  toggleBookmark,
};
