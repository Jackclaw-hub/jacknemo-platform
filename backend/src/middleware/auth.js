const NativeAuth = require('../auth-native');
const auth = new NativeAuth();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Also support token via query param (for SSE EventSource which can't set headers)
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  const result = auth.verifyToken(token);
  if (!result.valid) {
    return res.status(403).json({ error: result.error });
  }
  req.user = result.user;
  next();
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };
