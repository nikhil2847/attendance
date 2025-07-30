const express = require('express');
const db = require('../config/database.js');
const { requireManager } = require('../middleware/auth.js');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Get all users in organization (manager only)
router.get('/', requireManager, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, role, created_at FROM users WHERE organization_id = ?',
      [req.user.organization_id]
    );
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (manager only)
router.post('/', requireManager, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password, role, organization_id) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, role, req.user.organization_id]
    );
    
    res.status(201).json({ 
      message: 'User created successfully',
      userId: result.insertId 
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update user (manager only)
router.put('/:userId', requireManager, async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, role } = req.body;
    
    await db.execute(
      'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ? AND organization_id = ?',
      [username, email, role, userId, req.user.organization_id]
    );
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (manager only)
router.delete('/:userId', requireManager, async (req, res) => {
  try {
    const { userId } = req.params;
    
    await db.execute(
      'DELETE FROM users WHERE id = ? AND organization_id = ?',
      [userId, req.user.organization_id]
    );
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// export default router;
module.exports = router;

// Reset user password (manager only)
router.put('/:userId/reset-password', requireManager, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute(
      'UPDATE users SET password = ? WHERE id = ? AND organization_id = ?',
      [hashedPassword, userId, req.user.organization_id]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});