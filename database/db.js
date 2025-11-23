const sqlite3 = require("sqlite3").verbose();
const path = require("path");

let dbPath;

// If running on Render → use persistent disk
if (process.env.RENDER) {
  dbPath = path.join("/opt/render/project/src/data", "inventory.db");
} else {
  // Local development
  dbPath = path.join(__dirname, "inventory.db");
}

const db = new sqlite3.Database(dbPath);

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

module.exports = { run, get, all, db };
