// K-86: Expiry reminder cron — notify providers 7 days before listing expires
const db = require('../config/database');
const { notifyListingExpiryReminder } = require('../services/notificationService');

// Query active listings expiring in a 6–8 day window to avoid duplicate sends
async function sendExpiryReminders() {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString();
    const windowEnd   = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString();

    const res = await db.query(
      `SELECT id, title, expires_at, provider_id
         FROM listings
        WHERE status = 'active'
          AND expires_at >= $1
          AND expires_at <  $2`,
      [windowStart, windowEnd]
    );

    if (!res.rows.length) {
      console.log('[EXPIRY-REMINDER] No listings expiring in 7-day window.');
      return [];
    }

    const sent = [];
    for (const listing of res.rows) {
      try {
        // Look up provider email separately (avoids JOIN, compatible with mock DB)
        const userRes = await db.query('SELECT email FROM users WHERE id = $1', [listing.provider_id]);
        const providerEmail = userRes.rows[0]?.email;
        if (!providerEmail) continue;
        await notifyListingExpiryReminder(listing, providerEmail);
        sent.push(listing.id);
        console.log(`[EXPIRY-REMINDER] Sent reminder for listing ${listing.id} (${listing.title}) to ${providerEmail}`);
      } catch (e) {
        console.error(`[EXPIRY-REMINDER] Failed for listing ${listing.id}:`, e.message);
      }
    }
    return sent;
  } catch (e) {
    console.error('[EXPIRY-REMINDER] Error:', e.message);
    return [];
  }
}

function startExpiryReminderCron() {
  if (process.env.NODE_ENV === 'test') return;
  try {
    const cron = require('node-cron');
    // Run every day at 09:00 UTC
    cron.schedule('0 9 * * *', () => {
      console.log('[EXPIRY-REMINDER] Running daily expiry reminder check...');
      sendExpiryReminders();
    });
    console.log('[EXPIRY-REMINDER] Cron scheduled (daily 09:00 UTC)');
  } catch (e) {
    console.warn('[EXPIRY-REMINDER] node-cron not available:', e.message);
  }
}

module.exports = { startExpiryReminderCron, sendExpiryReminders };
