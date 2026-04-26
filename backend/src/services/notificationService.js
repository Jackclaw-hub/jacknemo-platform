// K-21: Email Service — Resend API (native fetch) + SMTP nodemailer fallback + console log
const db = require("../config/database");

// ── Resend (primary when RESEND_API_KEY set) ──────────────────────────────
async function sendViaResend(to, subject, html, text) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const from = process.env.EMAIL_FROM || "NemoClaw <noreply@startup-radar.de>";
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error("[NOTIFY] Resend error:", resp.status, err.message || "");
      return false;
    }
    console.log("[NOTIFY] Email sent via Resend to", to);
    return true;
  } catch (e) {
    console.error("[NOTIFY] Resend fetch error:", e.message);
    return false;
  }
}

// ── SMTP fallback ─────────────────────────────────────────────────────────
let _transporter = null;
function getSmtp() {
  if (_transporter) return _transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const nodemailer = require("nodemailer");
      _transporter = nodemailer.createTransport({
        host: SMTP_HOST, port: parseInt(SMTP_PORT || "587"),
        secure: SMTP_PORT === "465", auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
      console.log("[NOTIFY] SMTP configured:", SMTP_HOST);
    } catch(e) { console.warn("[NOTIFY] nodemailer not available:", e.message); }
  }
  return _transporter;
}

// ── Core send ─────────────────────────────────────────────────────────────
async function sendEmail(to, subject, html, text) {
  if (await sendViaResend(to, subject, html, text)) return true;
  const smtp = getSmtp();
  if (smtp) {
    try {
      await smtp.sendMail({ from: process.env.SMTP_FROM || "noreply@startup-radar.de", to, subject, html, text });
      console.log("[NOTIFY] Email sent via SMTP to", to);
      return true;
    } catch(e) { console.error("[NOTIFY] SMTP error:", e.message); }
  }
  console.log("[NOTIFY] [DEV] To:", to, "| Subject:", subject, "\n" + text.slice(0, 100));
  return false;
}

// ── Mock DB-compatible notification save ──────────────────────────────────
async function saveNotification(user_id, type, subject, body) {
  try {
    await db.query(
      "INSERT INTO notifications (user_id, type, subject, body) VALUES ($1, $2, $3, $4)",
      [user_id, type, subject, body]
    );
  } catch(e) { /* notifications table may not exist in mock — silently ignore */ }
}

// ── Get recipient email from DB ────────────────────────────────────────────
async function getUserEmail(userId) {
  try {
    const r = await db.query("SELECT email FROM users WHERE id = $1", [userId]);
    return r.rows[0]?.email || null;
  } catch(e) { return null; }
}

// ── Email templates ────────────────────────────────────────────────────────
const base = (title, body) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{font-family:system-ui,sans-serif;max-width:600px;margin:40px auto;color:#1f2937}
.header{background:#2563eb;color:#fff;padding:24px 32px;border-radius:8px 8px 0 0}
.body{background:#f9fafb;padding:24px 32px;border:1px solid #e5e7eb;border-top:0}
.footer{text-align:center;padding:16px;color:#9ca3af;font-size:12px}
.btn{display:inline-block;background:#2563eb;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px}
</style></head><body>
<div class="header"><h2 style="margin:0">🚀 Startup Radar</h2></div>
<div class="body">${body}</div>
<div class="footer">© 2026 NemoClaw / Startup Radar · <a href="https://jacknemo1994.de">jacknemo1994.de</a></div>
</body></html>`;

async function notifyListingApproved(listing, providerEmail) {
  const subject = "✅ Dein Inserat wurde genehmigt — Startup Radar";
  const html = base(subject, `
    <h3>Glückwunsch! Dein Inserat ist live.</h3>
    <p>Dein Inserat <strong>${listing.title}</strong> wurde genehmigt und ist jetzt für Gründer sichtbar.</p>
    <a href="https://jacknemo1994.de/provider-dashboard.html" class="btn">Dashboard öffnen →</a>
    <p style="margin-top:24px;color:#6b7280;font-size:14px">Dein Startup Radar Team</p>
  `);
  const text = `Dein Inserat "${listing.title}" wurde genehmigt und ist jetzt live. https://jacknemo1994.de`;
  await sendEmail(providerEmail, subject, html, text);
  await saveNotification(listing.provider_id, "listing_approved", subject, text);
}

async function notifyListingRejected(listing, providerEmail, reason) {
  const subject = "❌ Dein Inserat wurde abgelehnt — Startup Radar";
  const html = base(subject, `
    <h3>Leider wurde dein Inserat abgelehnt.</h3>
    <p>Inserat: <strong>${listing.title}</strong></p>
    <p><strong>Grund:</strong> ${reason || "Keine Angabe"}</p>
    <p>Du kannst das Inserat überarbeiten und erneut einreichen.</p>
    <a href="https://jacknemo1994.de/provider-dashboard.html" class="btn">Inserat bearbeiten →</a>
    <p style="margin-top:24px;color:#6b7280;font-size:14px">Dein Startup Radar Team</p>
  `);
  const text = `Dein Inserat "${listing.title}" wurde abgelehnt. Grund: ${reason || "Keine Angabe"}`;
  await sendEmail(providerEmail, subject, html, text);
  await saveNotification(listing.provider_id, "listing_rejected", subject, text);
}

async function notifyContactReceived(listing, providerUserId, founderName, message) {
  const email = await getUserEmail(providerUserId);
  if (!email) return;
  const subject = `📬 Neue Kontaktanfrage für "${listing.title}" — Startup Radar`;
  const html = base(subject, `
    <h3>Jemand interessiert sich für dein Inserat!</h3>
    <p><strong>${founderName}</strong> hat dich bezüglich <strong>${listing.title}</strong> kontaktiert.</p>
    ${message ? `<blockquote style="border-left:3px solid #2563eb;padding:8px 16px;color:#374151">${message}</blockquote>` : ""}
    <a href="https://jacknemo1994.de/messages.html" class="btn">Nachricht lesen →</a>
    <p style="margin-top:24px;color:#6b7280;font-size:14px">Dein Startup Radar Team</p>
  `);
  const text = `${founderName} hat dich wegen "${listing.title}" kontaktiert. https://jacknemo1994.de/messages.html`;
  await sendEmail(email, subject, html, text);
  await saveNotification(providerUserId, "contact_received", subject, text);
}

async function notifyHighScoreMatch(founderEmail, founderUserId, listing, score) {
  const pct = Math.round(score * 100);
  const subject = `🎯 Neuer ${pct}%-Match auf Startup Radar`;
  const html = base(subject, `
    <h3>${pct}% Match gefunden!</h3>
    <p>Neues Inserat passend zu deinem Profil:</p>
    <p><strong>${listing.title}</strong> — ${listing.type || ""} in ${listing.city || listing.geo || ""}</p>
    <a href="https://jacknemo1994.de/founder-dashboard.html" class="btn">Match ansehen →</a>
  `);
  const text = `${pct}% Match: "${listing.title}" in ${listing.city || listing.geo || ""}. https://jacknemo1994.de`;
  await sendEmail(founderEmail, subject, html, text);
  await saveNotification(founderUserId, "high_score_match", subject, text);
}

module.exports = { notifyListingApproved, notifyListingRejected, notifyContactReceived, notifyHighScoreMatch };
