const db = require('../config/database');
const crypto = require('crypto');

function generateCode() {
  return crypto.randomBytes(5).toString('hex').toUpperCase(); // e.g. "A1B2C3D4E5"
}

const getReferralCode = async (req, res) => {
  try {
    let result = await db.query(
      'SELECT * FROM referral_codes WHERE user_id=$1',
      [req.user.id]
    );
    if (!result.rows.length) {
      // Create new code
      let code;
      let attempts = 0;
      while (attempts < 5) {
        code = generateCode();
        try {
          result = await db.query(
            'INSERT INTO referral_codes (user_id, code) VALUES ($1,$2) RETURNING *',
            [req.user.id, code]
          );
          break;
        } catch(e) { attempts++; } // retry on unique conflict
      }
    }
    const stats = await getReferralStats(req.user.id);
    res.json({ code: result.rows[0], stats });
  } catch (err) {
    console.error('getReferralCode error:', err);
    res.status(500).json({ error: 'Failed to get referral code' });
  }
};

const getReferralStatsEndpoint = async (req, res) => {
  try {
    const stats = await getReferralStats(req.user.id);
    res.json(stats);
  } catch (err) {
    console.error('getReferralStats error:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
};

async function getReferralStats(userId) {
  const result = await db.query(
    `SELECT rc.uses,
            (SELECT COUNT(*) FROM referral_uses WHERE referrer_id=$1) as confirmed_uses
     FROM referral_codes rc WHERE rc.user_id=$1`,
    [userId]
  );
  const row = result.rows[0];
  const uses = parseInt(row?.confirmed_uses) || 0;
  return {
    uses,
    earlyAdopter: uses >= 3,
    badge: uses >= 3 ? 'Early Adopter' : null,
  };
}

module.exports = { getReferralCode, getReferralStatsEndpoint };
