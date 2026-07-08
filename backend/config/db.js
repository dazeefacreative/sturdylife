const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Temporary startup diagnostic — writes to a local file (not exposed over HTTP)
// since console.log output wasn't showing up in stderr.log and we need to see
// what env vars this specific process actually resolved. Remove this whole
// block, and delete the file it writes, once the Namecheap DB connection is
// confirmed working.
try {
  fs.writeFileSync(
    path.join(__dirname, "..", "debug-env.json"),
    JSON.stringify({
      pid: process.pid,
      bootedAt: new Date().toISOString(),
      DB_HOST: process.env.DB_HOST || "localhost",
      DB_PORT: process.env.DB_PORT || 3306,
      DB_USER: process.env.DB_USER,
      DB_NAME: process.env.DB_NAME,
      DB_PASSWORD_length: (process.env.DB_PASSWORD || "").length,
    }, null, 2)
  );
} catch (e) {
  console.error("debug-env write failed:", e.message);
}

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
