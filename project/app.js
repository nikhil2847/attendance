// index.mjs or server.mjs (must use .mjs or set "type": "module" in package.json)

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { authenticateToken } from './server/middleware/auth.js';
import authRoutes from './server/routes/auth.js';
import attendanceRoutes from './server/routes/attendance.js';
import userRoutes from './server/routes/users.js';
import invoiceRoutes from './server/routes/invoices.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Trust proxy for cPanel
app.set('trust proxy', 1);

// Basic request logger
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//   next();
// });

// CORS setup
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    '*'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/invoices', authenticateToken, invoiceRoutes);

// Health check route
// app.get('/api/health', (req, res) => {
//   res.json({
//     status: 'OK',
//     message: 'cPanel Node.js App is running',
//     timestamp: new Date().toISOString(),
//     port: PORT,
//     // Environment fallback message
//     environment: 'production (no NODE_ENV set)'
//   });
// });

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ cPanel Node.js App running on port ${PORT}`);
  console.log(`🔍 Health check available at: http://localhost:${PORT}/api/health`);
});
