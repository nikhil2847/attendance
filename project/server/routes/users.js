// const express = require('express');
// import express from 'express';
// import db from '../config/database.js';
// import { requireManager } from '../middleware/auth.js';
const express = require('express');
const db = require('../config/database.js');
const { requireManager } = require('../middleware/auth.js');
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

// export default router;
module.exports = router;