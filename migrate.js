const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const dbFile = './database/inventory.db';
const dir = './database';

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(`PRAGMA foreign_keys = ON;`);
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      unit TEXT NOT NULL DEFAULT 'pcs',
      category TEXT NOT NULL DEFAULT 'uncategorized',
      brand TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'out_of_stock',
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      old_quantity INTEGER,
      new_quantity INTEGER,
      changed_by TEXT,
      change_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  console.log('Migrations complete — database file:', dbFile);
  db.close();
});
