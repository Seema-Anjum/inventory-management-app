const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

// Use Render persistent storage (production) OR local file (development)
const dbPath =
  process.env.DB_PATH ||
  path.join(__dirname, "inventory.db"); // local file (backend/database/inventory.db)

// Ensure directory exists
const folder = path.dirname(dbPath);
if (!fs.existsSync(folder)) {
  fs.mkdirSync(folder, { recursive: true });
  console.log("Created DB directory:", folder);
}

// Create SQLite database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("SQLite Error:", err);
  } else {
    console.log("SQLite connected at:", dbPath);
  }
});

// --- Promisified helpers ---
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = { db, run, get, all };
