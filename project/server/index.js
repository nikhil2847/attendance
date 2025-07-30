
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const path = require('path');

const { authenticateToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const userRoutes = require('./routes/users');
const invoiceRoutes = require('./routes/invoices');
// dotenv.config();

const app = express();
const PORT = process.env.PORT;

// app.use(cors());
app.use(
  cors({
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/invoices', authenticateToken, invoiceRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


