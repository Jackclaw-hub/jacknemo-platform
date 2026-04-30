// K-66: Admin CSV export — no external deps, pure Node
const db = require('../config/database');

function toCSV(rows, columns) {
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n\r]/.test(s) ? `"${s}"` : s;
  };
  const header = columns.map(c => c.label).join(',');
  const lines = rows.map(row => columns.map(c => escape(row[c.key])).join(','));
  return [header, ...lines].join('\r\n');
}

const exportListings = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, type, status, geo, city, provider_id,
              is_premium, is_featured, view_count, contact_count,
              expires_at, created_at, updated_at
         FROM listings
        ORDER BY created_at DESC
        LIMIT 5000`
    );
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'geo', label: 'Geo' },
      { key: 'city', label: 'City' },
      { key: 'provider_id', label: 'Provider ID' },
      { key: 'is_premium', label: 'Premium' },
      { key: 'is_featured', label: 'Featured' },
      { key: 'view_count', label: 'Views' },
      { key: 'contact_count', label: 'Contacts' },
      { key: 'expires_at', label: 'Expires At' },
      { key: 'created_at', label: 'Created At' },
      { key: 'updated_at', label: 'Updated At' },
    ];
    const csv = toCSV(result.rows, columns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="listings-export.csv"');
    res.send(csv);
  } catch (e) {
    console.error('exportListings error:', e);
    res.status(500).json({ error: 'Export failed' });
  }
};

const exportUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, name, role, email_verified, is_active, created_at
         FROM users
        ORDER BY created_at DESC
        LIMIT 5000`
    );
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'email', label: 'Email' },
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'email_verified', label: 'Email Verified' },
      { key: 'is_active', label: 'Active' },
      { key: 'created_at', label: 'Created At' },
    ];
    const csv = toCSV(result.rows, columns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="users-export.csv"');
    res.send(csv);
  } catch (e) {
    console.error('exportUsers error:', e);
    res.status(500).json({ error: 'Export failed' });
  }
};

module.exports = { exportListings, exportUsers };
