const mysql = require("mysql2/promise");

// Temporary startup diagnostic — remove once the Namecheap DB connection is confirmed working.
console.log("[db config]", {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  passwordLength: (process.env.DB_PASSWORD || "").length,
});

const pool = mysql.createPool({
  host:            process.env.DB_HOST || "localhost",
  port:            process.env.DB_PORT || 3306,
  user:            process.env.DB_USER,
  password:        process.env.DB_PASSWORD,
  database:        process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit:      0,
  charset:         "utf8mb4",
});

module.exports = pool;
