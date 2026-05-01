// K-67: Listing report/flag abuse system
const db = require('../config/database');

const VALID_REASONS = ['spam', 'misleading', 'inappropriate', 'duplicate', 'other'];

// POST /listings/:id/report — authenticated users flag a listing
const reportListing = async (req, res) => {
  const listingId = req.params.id;
  const { reason = 'other', details } = req.body;
  if (!VALID_REASONS.includes(reason)) {
    return res.status(400).json({ error: 'Invalid reason. Must be one of: ' + VALID_REASONS.join(', ') });
  }
  try {
    const lr = await db.query('SELECT id FROM listings WHERE id = $1', [listingId]);
    if (!lr.rows[0]) return res.status(404).json({ error: 'Listing not found' });

    const r = await db.query(
      `INSERT INTO listing_reports (listing_id, reporter_id, reason, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (listing_id, reporter_id) DO NOTHING RETURNING *`,
      [listingId, req.user.id, reason + (details ? ': ' + details.slice(0, 200) : '')]
    );
    if (!r.rows[0]) {
      return res.status(409).json({ error: 'You have already reported this listing' });
    }
    res.status(201).json({ report: r.rows[0], message: 'Report submitted' });
  } catch (e) {
    console.error('reportListing error:', e);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

// GET /admin/reports — list open (undismissed) reports with listing info + reporter email
const getReports = async (req, res) => {
  try {
    const r = await db.query(
      `SELECT lr.id, lr.listing_id, lr.reporter_id, lr.reason, lr.dismissed, lr.created_at,
              l.title AS listing_title, l.status AS listing_status, l.provider_id
         FROM listing_reports lr
         JOIN listings l ON l.id = lr.listing_id
        WHERE lr.dismissed = false
        ORDER BY lr.created_at DESC`
    );

    // K-94: Enrich with reporter emails — sequential queries (mock DB JOIN-safe)
    const emailCache = {};
    async function getEmail(userId) {
      if (!userId) return null;
      if (emailCache[userId] !== undefined) return emailCache[userId];
      try {
        const er = await db.query('SELECT email FROM users WHERE id = $1', [userId]);
        emailCache[userId] = er.rows[0]?.email || null;
      } catch { emailCache[userId] = null; }
      return emailCache[userId];
    }

    // Build groups and collect unique reporter IDs
    const byListing = {};
    r.rows.forEach(row => {
      if (!byListing[row.listing_id]) byListing[row.listing_id] = { ...row, count: 0, reports: [] };
      byListing[row.listing_id].count++;
      byListing[row.listing_id].reports.push({ id: row.id, reason: row.reason, reporter_id: row.reporter_id, created_at: row.created_at });
    });

    // Fetch emails for all unique reporter IDs
    const allReporterIds = [...new Set(r.rows.map(row => row.reporter_id).filter(Boolean))];
    await Promise.all(allReporterIds.map(id => getEmail(id)));

    // Attach reporter_email to each report entry
    const groups = Object.values(byListing).map(g => ({
      ...g,
      reports: g.reports.map(rep => ({
        ...rep,
        reporter_email: emailCache[rep.reporter_id] || null,
      })),
    }));

    res.json({ groups, total: r.rows.length });
  } catch (e) {
    console.error('getReports error:', e);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// PATCH /admin/reports/:id/dismiss — mark a report as dismissed
const dismissReport = async (req, res) => {
  try {
    const r = await db.query(
      'UPDATE listing_reports SET dismissed = true WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Report not found' });
    res.json({ report: r.rows[0], message: 'Dismissed' });
  } catch (e) {
    console.error('dismissReport error:', e);
    res.status(500).json({ error: 'Failed to dismiss report' });
  }
};

// GET /listings/:id/reports/count — public count for a listing (for display)
const getReportCount = async (req, res) => {
  try {
    const r = await db.query(
      'SELECT * FROM listing_reports WHERE listing_id = $1',
      [req.params.id]
    );
    res.json({ count: r.rows.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch report count' });
  }
};

module.exports = { reportListing, getReports, dismissReport, getReportCount };
