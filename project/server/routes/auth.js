// import express from 'express';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import { v4 as uuidv4 } from 'uuid';
// import nodemailer from 'nodemailer';
// import db from '../config/database.js';
// import { authenticateToken, requireManager } from '../middleware/auth.js';
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const { authenticateToken, requireManager } = require('../middleware/auth.js');

const db = require('../config/database');
// const router = express.Router();


const router = express.Router();

// Email transporter
const transporter = nodemailer.createTransport({
  host: 'mail.payrollify.in',
  port: 465,
  secure: true,
  auth: {
    user: 'info@payrollify.in',
    pass: 'Nowgray@2025',
  },
  tls: {
    rejectUnauthorized: false, // Important: ignore self-signed cert issues
  },
});

// const transporter = nodemailer.createTransport({
//   host: 'smtp.hostinger.com',
//   port: 587,
//   secure: false, // 465 = true, 587 = false
//   auth: {
//     user: 'info@payrollify.in',
//     pass: 'VPkO^5y!4f',
//   },
//   tls: {
//     rejectUnauthorized: false, // Important: ignore self-signed cert issues
//   },
// });



console.log('Using transporter config:', transporter.options);

// Create organization
router.post('/create-organization', async (req, res) => {
  try {
    const { organizationName, email, password, firstName, lastName } = req.body;

    const [existingOrg] = await db.execute(
      'SELECT id FROM organizations WHERE name = ?',
      [organizationName]
    );

    if (existingOrg.length > 0) {
      return res.status(400).json({ error: 'Organization name already exists' });
    }

    const [orgResult] = await db.execute(
      'INSERT INTO organizations (name) VALUES (?)',
      [organizationName]
    );

    const organizationId = orgResult.insertId;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult] = await db.execute(
      'INSERT INTO users (organization_id, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
      [organizationId, email, hashedPassword, firstName, lastName, 'manager']
    );

    const token = jwt.sign(
      { userId: userResult.insertId, organizationId, role: 'manager' },
      '658d85d4c1446c9454815341f03967de',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Organization created successfully',
      token,
      user: {
        id: userResult.insertId,
        email,
        firstName,
        lastName,
        role: 'manager',
        organizationName
      }
    });
  } catch (error) {
    console.error('Invite error:', error); // This will show the real error in your terminal
    res.status(500).json({ error: 'Failed  invitation', details: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { organizationName, email, password } = req.body;

    const [users] = await db.execute(
      `SELECT u.*, o.name as organization_name 
       FROM users u 
       JOIN organizations o ON u.organization_id = o.id 
       WHERE o.name = ? AND u.email = ? AND u.is_active = true`,
      [organizationName, email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, organizationId: user.organization_id, role: user.role },
      '658d85d4c1446c9454815341f03967de',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        organizationName: user.organization_name,
        hourlyRate: user.hourly_rate
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Invite
router.post('/invite', authenticateToken, requireManager, async (req, res) => {
  try {
    const { email, role = 'employee' } = req.body;
    const organizationId = req.user.organization_id;

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE organization_id = ? AND email = ?',
      [organizationId, email]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists in organization' });
    }

    // Check if invitation already sent and not used
    const [existingInvites] = await db.execute(
      'SELECT id FROM invitations WHERE organization_id = ? AND email = ? AND used = 0 AND expires_at > NOW()',
      [organizationId, email]
    );
    if (existingInvites.length > 0) {
      return res.status(400).json({ error: 'Active invitation already sent to this email' });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.execute(
      'INSERT INTO invitations (organization_id, email, token, role, expires_at, used) VALUES (?, ?, ?, ?, ?, 0)',
      [organizationId, email, token, role, expiresAt]
    );

    const inviteLink = `${process.env.FRONTEND_URL || 'https://app.payrollify.in'}/accept-invitation?token=${token}`;
    // const inviteLink = `${process.env.FRONTEND_URL}/accept-invitation?token=${token}`;

    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: email,
    //   subject: `Invitation to join ${req.user.organization_name}`,
    //   html: `
    //     <h2>You've been invited to join ${req.user.organization_name}</h2>
    //     <p>Click the link below to accept the invitation and create your account:</p>
    //     <a href="${inviteLink}" style="background: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
    //     <p>This invitation expires in 7 days.</p>
    //   `
    // });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Invitation to join ${req.user.organization_name}`,
      text: `You've been invited to join ${req.user.organization_name}. Click here to accept: ${inviteLink}. This invitation expires in 7 days.`,
      html: `
    <h2>You've been invited to join ${req.user.organization_name}</h2>
    <p>Click the link below to accept the invitation and create your account:</p>
    <a href="${inviteLink}" style="background: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
    <p>This invitation expires in 7 days.</p>
  `
    });

    res.json({ message: 'Invitation sent successfully' });
  }
  catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'SMTP is disabled for free verstion please create credentials', details: error.message });
  }
});

// Accept Invitation
router.post('/accept-invitation', async (req, res) => {
  try {
    const { token, firstName, lastName, password } = req.body;

    // Only allow unused and unexpired invitations
    const [invitations] = await db.execute(
      'SELECT * FROM invitations WHERE token = ? AND expires_at > NOW() AND used = 0',
      [token]
    );
    if (invitations.length === 0) {
      return res.status(400).json({ error: 'Invalid, expired, or already used invitation' });
    }
    const invitation = invitations[0];

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE organization_id = ? AND email = ?',
      [invitation.organization_id, invitation.email]
    );
    if (existingUsers.length > 0) {
      // Mark invitation as used to prevent further attempts
      await db.execute('UPDATE invitations SET used = 1 WHERE id = ?', [invitation.id]);
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO users (organization_id, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
      [invitation.organization_id, invitation.email, hashedPassword, firstName, lastName, invitation.role]
    );
    await db.execute(
      'UPDATE invitations SET used = 1 WHERE id = ?',
      [invitation.id]
    );

    res.json({ message: 'Account created successfully. You can now log in.' });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Failed to accept invitation', details: error.message });
  }
});

// Create user credentials directly (Manager only)
router.post('/create-credentials', authenticateToken, requireManager, async (req, res) => {
  try {
    const { email, firstName, lastName, password, role = 'employee', hourlyRate = 0 } = req.body;
    const organizationId = req.user.organization_id;

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE organization_id = ? AND email = ?',
      [organizationId, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists in organization' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult] = await db.execute(
      'INSERT INTO users (organization_id, email, password, first_name, last_name, role, hourly_rate, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [organizationId, email, hashedPassword, firstName, lastName, role, hourlyRate]
    );

    res.json({
      message: 'User credentials created successfully',
      userId: userResult.insertId
    });
  } catch (error) {
    console.error('Create credentials error:', error);
    res.status(500).json({ error: 'Failed to create user credentials', details: error.message });
  }
});

// export default router;
module.exports = router;
