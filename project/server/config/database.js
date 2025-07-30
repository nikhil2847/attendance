// import mysql from 'mysql2/promise';
// import dotenv from 'dotenv';
const mysql = require('mysql2');
require('dotenv').config();
// dotenv.config();

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

const pool = mysql.createPool({
  host: '46.202.142.2',
  user: 'u503143902_attendenece',
  password: 'Nowgray@2025',
  database: 'u503143902_attendenece',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log("ENV VALUES =>", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});


const promisePool = pool.promise();

// export default pool;

module.exports = promisePool;