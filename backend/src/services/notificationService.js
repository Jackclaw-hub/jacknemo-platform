// Notification Service — KAN-014
// Sends emails via nodemailer when SMTP env vars set, otherwise logs to console.
const db = require('../config/database');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransporter({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587'),
      secure: SMTP_PORT === '465',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    console.log('[NOTIFY] SMTP configured via', SMTP_HOST);
    return transporter;
  }
  return null;
}

async function sendEmail(to, subject, body) {
  const t = getTransporter();
  const from = process.env.SMTP_FROM || 'noreply@startup-radar.de';
  if (t) {
    try {
      await t.sendMail({ from, to, subject, text: body });
      console.log('[NOTIFY] Email sent to', to);
      return true;
    } catch(err) {
      console.error('[NOTIFY] SMTP error:', err.message);
    }
  }
  // Fallback: log to console
  console.log('[NOTIFY] [NO_SMTP] To:', to, '| Subject:', subject);
  return false;
}

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      type VARCHAR(50),
      subject VARCHAR(255),
      body TEXT,
      sent_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
}

async function saveNotification(user_id, type, subject, body) {
  try {
    await ensureTable();
    await db.query(
      'INSERT INTO notifications (user_id, type, subject, body) VALUES (,,,)',
      [user_id, type, subject, body]
    );
  } catch(err) { console.error('[NOTIFY] DB save error:', err.message); }
}

async function notifyListingApproved(listing, providerEmail) {
  const subject = 'Dein Inserat wurde genehmigt — Startup Radar';
  const body = `Hallo,

Dein Inserat ${listing.title} wurde genehmigt und ist jetzt sichtbar.

Viel Erfolg!
Startup Radar Team`;
  await sendEmail(providerEmail, subject, body);
  await saveNotification(listing.provider_id, 'listing_approved', subject, body);
}

async function notifyListingRejected(listing, providerEmail, reason) {
  const subject = 'Dein Inserat wurde abgelehnt — Startup Radar';
  const body = `Hallo,

Dein Inserat ${listing.title} wurde abgelehnt.
Grund: ${reason || 'Keine Angabe'}

Du kannst es überarbeiten und neu einreichen.
Startup Radar Team`;
  await sendEmail(providerEmail, subject, body);
  await saveNotification(listing.provider_id, 'listing_rejected', subject, body);
}

async function notifyHighScoreMatch(founderEmail, founderUserId, listing, score) {
  const pct = Math.round(score * 100);
  const subject = `Neuer ${pct}% Match auf Startup Radar`;
  const body = `Hallo,

Neues Inserat mit ${pct}% Match für dich:
${listing.title} — ${listing.type} in ${listing.city || listing.geo}

https://jacknemo1994.de/founder-dashboard.html
Startup Radar Team`;
  await sendEmail(founderEmail, subject, body);
  await saveNotification(founderUserId, 'high_score_match', subject, body);
}

module.exports = { notifyListingApproved, notifyListingRejected, notifyHighScoreMatch };
