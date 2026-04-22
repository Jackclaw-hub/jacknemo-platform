const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

function generateToken(user) {
    const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: '1h' });
    return token;
}

function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        return decoded;
    } catch (err) {
        return null;
    }
}

function generateSecret() {
    const secret = speakeasy.generateSecret({ length: 16 }).base32;
    return secret;
}

function verifyCode(user, code) {
    const verified = speakeasy.totp.verify({
        secret: user.secret,
        encoding: 'base32',
        token: code,
    });
    return verified;
}

module.exports = { generateToken, verifyToken, generateSecret, verifyCode };