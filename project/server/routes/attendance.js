//  import moment from 'moment-timezone';
// import express from 'express';
// import db from '../config/database.js';
const express = require('express');
const db = require('../config/database');
const moment = require('moment-timezone');
const router = express.Router();

router.post('/checkin', async (req, res) => {
  try {
    const userId = req.user.id;
    const { notes = '' } = req.body;

    // Check if user is already checked in
    const [activeSession] = await db.execute(
      'SELECT id FROM attendance WHERE user_id = ? AND check_out IS NULL',
      [userId]
    );

    if (activeSession.length > 0) {
      return res.status(400).json({ error: 'Already checked in' });
    }

    // Create UTC time using moment, but pass as JS Date object
    const checkInUTC = moment.utc().toDate(); // This returns a valid JS Date object for MySQL

    // Insert with UTC timestamp
    const [insertResult] = await db.execute(
      'INSERT INTO attendance (user_id, check_in, notes) VALUES (?, ?, ?)',
      [userId, checkInUTC, notes]
    );

    const attendanceId = insertResult.insertId;

    // Fetch the inserted check-in time from DB
    const [rows] = await db.execute(
      'SELECT check_in FROM attendance WHERE id = ?',
      [attendanceId]
    );

    const checkInRaw = rows[0]?.check_in;

    // Convert to EST (America/New_York)
    const checkInEST = moment(checkInRaw).tz('America/New_York').format('MM/DD/YYYY hh:mm A');

    res.json({
      message: 'Checked in successfully',
      attendanceId,
      checkIn: checkInEST, // raw UTC
      checkInEST // human-readable EST/EDT
    });

  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({ error: 'Internal server', details: error.message });
  }
});


// Check out
// router.post('/checkout', async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { notes = '' } = req.body;

//     // Find active session
//     const [activeSession] = await db.execute(
//       'SELECT id, check_in FROM attendance WHERE user_id = ? AND check_out IS NULL',
//       [userId]
//     );

//     if (activeSession.length === 0) {
//       return res.status(400).json({ error: 'No active session found' });
//     }

//     const session = activeSession[0];
//     const checkIn = new Date(session.check_in);
//     const checkOut = new Date();
//     const totalHours = (checkOut - checkIn) / (1000 * 60 * 60); // Convert to hours

//     // Update attendance record
//     // await db.execute(
//     //   'UPDATE attendance SET check_out = NOW(), total_hours = ?, notes = CONCAT(COALESCE(notes, ""), ?) WHERE id = ?',
//     //   [totalHours, notes ? `\nCheckout: ${notes}` : '', session.id]
//     // );

//     await db.execute(
//       'UPDATE attendance SET check_out = UTC_TIMESTAMP(), total_hours = ?, notes = CONCAT(COALESCE(notes, ""), ?) WHERE id = ?',
//       [totalHours, notes ? `\nCheckout: ${notes}` : '', session.id]
//     );

//     res.json({
//       message: 'Checked out successfully',
//       totalHours: totalHours.toFixed(2),
//       checkOut
//     });
//   } catch (error) {
//     console.error('Check out error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });
router.post('/checkout', async (req, res) => {
  try {
    const userId = req.user.id;
    const { notes = '' } = req.body;

    // Find active session
    const [activeSession] = await db.execute(
      'SELECT id, check_in FROM attendance WHERE user_id = ? AND check_out IS NULL',
      [userId]
    );

    if (activeSession.length === 0) {
      return res.status(400).json({ error: 'No active session found' });
    }

    const session = activeSession[0];

    // Set check_out time in UTC
    const checkOutUTC = moment.utc().toDate();

    // Update checkout time and notes, calculate total hours
    await db.execute(
      `UPDATE attendance 
       SET 
         check_out = ?, 
         total_hours = TIMESTAMPDIFF(SECOND, check_in, ?)/3600,
         notes = CONCAT(COALESCE(notes, ""), ?) 
       WHERE id = ?`,
      [checkOutUTC, checkOutUTC, notes ? `\nCheckout: ${notes}` : '', session.id]
    );

    // Get updated session
    const [updated] = await db.execute(
      'SELECT check_in, check_out, total_hours FROM attendance WHERE id = ?',
      [session.id]
    );

    const { check_in, check_out, total_hours } = updated[0];

    // Convert check_out to EST for human-readable output
    const checkOutEST = moment(check_out).tz('America/New_York').format('MM/DD/YYYY hh:mm A');

    res.json({
      message: 'Checked out successfully',
      totalHours: parseFloat(total_hours).toFixed(2),
      checkOut: moment(check_out).toISOString(), // raw UTC
      checkOutEST // human-readable EST/EDT
    });
  } catch (error) {
    console.error('Check out error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});



// Get attendance records
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    const currentUserId = req.user.id;
    const isManager = req.user.role === 'manager';

    let query = `
      SELECT a.*, u.first_name, u.last_name, u.email, u.hourly_rate
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE u.organization_id = ?
    `;
    const params = [req.user.organization_id];

    // Manager vs employee data filter
    if (!isManager) {
      query += ' AND a.user_id = ?';
      params.push(currentUserId);
    } else if (userId) {
      query += ' AND a.user_id = ?';
      params.push(userId);
    }

    // Filter records from last 4 hours using UTC
    if (!startDate && !endDate) {
      const fourHoursAgoUTC = moment.utc().subtract(4, 'hours').format('YYYY-MM-DD HH:mm:ss');
      query += ' AND a.check_in >= ?';
      params.push(fourHoursAgoUTC);
    } else {
      if (startDate) {
        query += ' AND DATE(a.check_in) >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND DATE(a.check_in) <= ?';
        params.push(endDate);
      }
    }

    query += ' ORDER BY a.check_in DESC';

    const [records] = await db.execute(query, params);
    res.json(records);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});


// Get current status

router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('userId:', userId);
    const [activeSession] = await db.execute(
      'SELECT id, check_in as check_in, notes FROM attendance WHERE user_id = ? AND check_out IS NULL',
      [userId]
    );

    if (activeSession.length > 0) {
      const session = activeSession[0];
      console.log('Active session:', session);
      // Interpret check_in as UTC (important if stored as DATETIME)


      const checkInEST = moment.utc(session.check_in).subtract(4, 'hours'); // moment object
      const nowEST = moment.utc().subtract(4, 'hours'); // also moment object
      console.log('Check-in EST:', checkInEST.format());
      console.log('Now EST:', nowEST.format());
      const hoursWorked = nowEST.diff(checkInEST, 'hours', true); // returns float hours
      const totalSeconds = Math.floor(hoursWorked * 3600);

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const formatted = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      res.json({
        isCheckedIn: true,
        checkIn: checkInEST.format("MM/DD/YYYY hh:mm:ss A"),// if you prefer strict format
        hoursWorked: formatted,
        notes: session.notes
      });
    } else {
      res.json({ isCheckedIn: false });
    }
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// export default router;
module.exports = router;