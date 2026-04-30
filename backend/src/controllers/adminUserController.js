// K-65: Admin user management
const User = require('../models/User');
const db = require('../config/database');

const listUsers = async (req, res) => {
  const { role, is_active, search, page = 1, limit = 50 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const offset = (pageNum - 1) * limitNum;
  try {
    const [users, total] = await Promise.all([
      User.listAll({ role, is_active, search, limit: limitNum, offset }),
      User.countAll({ role, is_active, search }),
    ]);
    res.json({ users, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) });
  } catch (e) {
    console.error('listUsers error:', e);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const disableUser = async (req, res) => {
  const { id } = req.params;
  if (String(id) === String(req.user.id)) {
    return res.status(400).json({ error: 'Cannot disable your own account' });
  }
  try {
    const user = await User.setActive(id, false);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user, message: 'Account disabled' });
  } catch (e) {
    console.error('disableUser error:', e);
    res.status(500).json({ error: 'Failed to disable user' });
  }
};

const enableUser = async (req, res) => {
  try {
    const user = await User.setActive(req.params.id, true);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user, message: 'Account enabled' });
  } catch (e) {
    console.error('enableUser error:', e);
    res.status(500).json({ error: 'Failed to enable user' });
  }
};

// K-87: Admin user detail — single user with listing count
const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(parseInt(req.params.id, 10) || req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const countRes = await db.query('SELECT COUNT(*) FROM listings WHERE provider_id = $1', [req.params.id]);
    const listing_count = parseInt(countRes.rows[0]?.count || 0);
    res.json({ user: { ...user, listing_count } });
  } catch (e) {
    console.error('getUserDetail error:', e);
    res.status(500).json({ error: 'Failed to fetch user detail' });
  }
};

module.exports = { listUsers, disableUser, enableUser, getUserDetail };
