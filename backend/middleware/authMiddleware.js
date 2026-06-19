import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECRET_JWT_PASSPHRASE_FOR_COPILOT';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[2]; // Support "Bearer token [token]" or standard Bearer token

  let actualToken = token;
  if (!actualToken && authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      actualToken = parts[1];
    } else {
      actualToken = authHeader; // fallback
    }
  }

  if (!actualToken) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  jwt.verify(actualToken, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

export function authorizeAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
