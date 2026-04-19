const cron = require('node-cron');
const { sendWeeklyDigest } = require('../services/digestService');

// Run every Sunday at 09:00
cron.schedule('0 9 * * 0', () => {
  console.log('[Cron] Triggering weekly digest...');
  sendWeeklyDigest().catch(console.error);
}, {
  timezone: 'Europe/Berlin'
});

console.log('[Cron] Weekly digest scheduled: Sundays 09:00 Europe/Berlin');

module.exports = { sendWeeklyDigest };
