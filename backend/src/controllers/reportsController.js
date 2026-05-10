const db = require('../db');

exports.submitReport = async (req, res) => {
    const { id: listing_id } = req.params;
    const reporter_id = req.user.id;
    const { reason, details } = req.body;

    if (!['spam', 'misleading', 'inappropriate', 'other'].includes(reason)) {
        return res.status(400).json({ error: 'Invalid reason' });
    }

    try {
        await db.query(
            'INSERT INTO listing_reports (listing_id, reporter_id, reason, details) VALUES ($1, $2, $3, $4)',
            [listing_id, reporter_id, reason, details]
        );
        res.json({ ok: true });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getReports = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT r.*, l.title as listing_title, u.email as reporter_email
             FROM listing_reports r
             JOIN listings l ON l.id = r.listing_id
             JOIN users u ON u.id = r.reporter_id
             ORDER BY r.created_at DESC`
        );
        res.json({ reports: rows });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};