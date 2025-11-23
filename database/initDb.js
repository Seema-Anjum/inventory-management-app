const { db, run } = require("./db");

// Create products table
const createProductsTable = `
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER NOT NULL
);
`;

// Optional: history table to track stock changes
const createHistoryTable = `
CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  old_stock INTEGER,
  new_stock INTEGER,
  changed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id)
);
`;

db.serialize(() => {
  db.run(createProductsTable, (err) => {
    if (err) console.error("Failed to create products table:", err);
    else console.log("Products table ready");
  });

  db.run(createHistoryTable, (err) => {
    if (err) console.error("Failed to create history table:", err);
    else console.log("History table ready");
  });
});
