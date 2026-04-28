// K-38: Premium expiry cron — runs daily, reverts expired premium listings
const db = require('../config/database');

async function revertExpiredPremium() {
  try {
    const res = await db.query(
      `UPDATE listings
         SET is_premium = false
       WHERE is_premium = true
         AND premium_expires_at IS NOT NULL
         AND premium_expires_at < $1
       RETURNING id, title`,
      [new Date().toISOString()]
    );
    if (res.rows.length > 0) {
      console.log('[PREMIUM-EXPIRY] Reverted', res.rows.length, 'expired listing(s):',
        res.rows.map(r => r.id).join(', '));
    }
    return res.rows;
  } catch (e) {
    console.error('[PREMIUM-EXPIRY] Error:', e.message);
    return [];
  }
}

function startPremiumExpiryCron() {
  // Only use node-cron in production; in test/dev just export the function
  if (process.env.NODE_ENV === 'test') return;
  try {
    const cron = require('node-cron');
    // Run every day at 02:00 UTC
    cron.schedule('0 2 * * *', () => {
      console.log('[PREMIUM-EXPIRY] Running daily expiry check...');
      revertExpiredPremium();
    });
    console.log('[PREMIUM-EXPIRY] Cron scheduled (daily 02:00 UTC)');
  } catch (e) {
    console.warn('[PREMIUM-EXPIRY] node-cron not available:', e.message);
  }
}

module.exports = { startPremiumExpiryCron, revertExpiredPremium };
