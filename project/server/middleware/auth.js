// import jwt from 'jsonwebtoken';
// import db from '../config/database.js'; 
const jwt = require('jsonwebtoken');
const db = require('../config/database');
console.log('DB object:', db);
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, '658d85d4c1446c9454815341f03967de');

    // Get user details from database
    const [users] = await db.execute(
      'SELECT u.*, o.name as organization_name FROM users u JOIN organizations o ON u.organization_id = o.id WHERE u.id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireManager = (req, res, next) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
};

// 👇 Export named functions
// export { authenticateToken, requireManager };
module.exports = { authenticateToken, requireManager };
