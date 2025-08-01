const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET not set');
    return res.status(500).json({ message: 'Server misconfiguration' });
  }
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload.username;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
