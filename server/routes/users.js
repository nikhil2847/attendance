// const express = require('express');
// import express from 'express';
// import db from '../config/database.js';
// import { requireManager } from '../middleware/auth.js';
const express = require('express');
const db = require('../config/database.js');
const { requireManager } = require('../middleware/auth.js');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Get all users (manager only)
router.get('/', requireManager, async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT id, email, first_name, last_name, role, hourly_rate, is_active, created_at
       FROM users 
       WHERE organization_id = ? 
       ORDER BY created_at DESC`,
      [req.user.organization_id]
    );

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user hourly rate (manager only)
router.put('/:userId/rate', requireManager, async (req, res) => {
  try {
    const { userId } = req.params;
    const { hourlyRate } = req.body;

    await db.execute(
      'UPDATE users SET hourly_rate = ? WHERE id = ? AND organization_id = ?',
      [hourlyRate, userId, req.user.organization_id]
    );

    res.json({ message: 'Hourly rate updated successfully' });
  } catch (error) {
    console.error('Update rate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deactivate user (manager only)
router.put('/:userId/deactivate', requireManager, async (req, res) => {
  try {
    const { userId } = req.params;

    await db.execute(
      'UPDATE users SET is_active = false WHERE id = ? AND organization_id = ?',
      [userId, req.user.organization_id]
    );

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

// Delete user (manager only)
router.delete('/:userId', requireManager, async (req, res) => {
  try {
    const { userId } = req.params;
    const organizationId = req.user.organization_id;

    // Check if user exists and belongs to organization
    const [users] = await db.execute(
      'SELECT id, role FROM users WHERE id = ? AND organization_id = ?',
      [userId, organizationId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Prevent deleting the last manager
    if (user.role === 'manager') {
      const [managers] = await db.execute(
        'SELECT COUNT(*) as count FROM users WHERE organization_id = ? AND role = "manager" AND is_active = 1',
        [organizationId]
      );

      if (managers[0].count <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last manager of the organization' });
      }
    }

    // Delete user (this will cascade delete attendance records due to foreign key)
    await db.execute(
      'DELETE FROM users WHERE id = ? AND organization_id = ?',
      [userId, organizationId]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// export default router;
module.exports = router;