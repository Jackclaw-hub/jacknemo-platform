// Notification Service — KAN-010
// Currently logs notifications to console + stores in DB notifications table.
// Replace sendEmail() with nodemailer when SMTP is configured.

const db = require('../config/database');

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      type VARCHAR(50),
      subject VARCHAR(255),
      body TEXT,
      sent_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {}); // ignore if table exists
}

async function sendEmail(to, subject, body) {
  // TODO: replace with nodemailer/sendgrid when SMTP configured
  console.log('[NOTIFY] To:', to, '| Subject:', subject);
  console.log('[NOTIFY] Body:', body.slice(0, 120));
}

async function notifyListingApproved(listing, providerEmail) {
  await ensureTable();
  const subject = 'Dein Inserat wurde genehmigt — Startup Radar';
  const body = `Hallo,

Dein Inserat ${listing.title} wurde genehmigt und ist jetzt auf dem Startup Radar sichtbar.

Viel Erfolg!
Das Startup Radar Team`;
  await sendEmail(providerEmail, subject, body);
  await db.query(
    'INSERT INTO notifications (user_id, type, subject, body) VALUES ($1,$2,$3,$4)',
    [listing.provider_id, 'listing_approved', subject, body]
  ).catch(console.error);
}

async function notifyListingRejected(listing, providerEmail, reason) {
  await ensureTable();
  const subject = 'Dein Inserat wurde abgelehnt — Startup Radar';
  const body = `Hallo,

Dein Inserat ${listing.title} wurde leider abgelehnt.
Grund: ${reason || 'Keine Angabe'}

Du kannst es überarbeiten und erneut einreichen.
Das Startup Radar Team`;
  await sendEmail(providerEmail, subject, body);
  await db.query(
    'INSERT INTO notifications (user_id, type, subject, body) VALUES ($1,$2,$3,$4)',
    [listing.provider_id, 'listing_rejected', subject, body]
  ).catch(console.error);
}

async function notifyHighScoreMatch(founderEmail, founderUserId, listing, score) {
  await ensureTable();
  const pct = Math.round(score * 100);
  const subject = `Neuer ${pct}% Match auf Startup Radar`;
  const body = `Hallo,

Ein neues Inserat passt sehr gut zu deinem Startup-Profil (${pct}% Match):

${listing.title} — ${listing.type} in ${listing.city || listing.geo}

Jetzt ansehen: https://jacknemo1994.de/founder-dashboard.html

Das Startup Radar Team`;
  await sendEmail(founderEmail, subject, body);
  await db.query(
    'INSERT INTO notifications (user_id, type, subject, body) VALUES ($1,$2,$3,$4)',
    [founderUserId, 'high_score_match', subject, body]
  ).catch(console.error);
}

module.exports = { notifyListingApproved, notifyListingRejected, notifyHighScoreMatch };
