const { db, run, get, all } = require("../utils/db");
const csv = require("csv-parser");
const fs = require("fs");

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await all("SELECT * FROM products");
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const { name, category, brand, stock, status } = req.body;
    const result = await run(
      "INSERT INTO products (name, category, brand, stock, status) VALUES (?, ?, ?, ?, ?)",
      [name, category, brand, stock, status]
    );
    res.status(201).json({ id: result.lastID, message: "Product created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, brand, stock, status } = req.body;

    const old = await get("SELECT stock FROM products WHERE id = ?", [id]);
    await run(
      "UPDATE products SET name=?, category=?, brand=?, stock=?, status=? WHERE id=?",
      [name, category, brand, stock, status, id]
    );

    // Track inventory history
    if (old && old.stock !== stock) {
      await run(
        "INSERT INTO inventory_history (product_id, old_quantity, new_quantity, changed_by, change_date) VALUES (?, ?, ?, ?, ?)",
        [id, old.stock, stock, "admin", new Date().toISOString()]
      );
    }

    res.json({ message: "Product updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await run("DELETE FROM products WHERE id=?", [id]);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { name } = req.query;
    const products = await all("SELECT * FROM products WHERE LOWER(name) LIKE ?", [`%${name.toLowerCase()}%`]);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get product history
exports.getHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await all("SELECT * FROM inventory_history WHERE product_id=? ORDER BY change_date DESC", [id]);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export CSV
exports.exportCSV = async (req, res) => {
  try {
    const products = await all("SELECT * FROM products");
    const headers = "id,name,category,brand,stock,status\n";
    const csvData = products.map(p => `${p.id},${p.name},${p.category},${p.brand},${p.stock},${p.status}`).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=products.csv");
    res.send(headers + csvData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Import CSV
exports.importCSV = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const results = [];
    const added = [];
    const skipped = [];

    fs.createReadStream(file.path)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", async () => {
        for (const p of results) {
          const exists = await get("SELECT id FROM products WHERE name=?", [p.name]);
          if (exists) skipped.push({ name: p.name, existingId: exists.id });
          else {
            await run(
              "INSERT INTO products (name, category, brand, stock, status) VALUES (?, ?, ?, ?, ?)",
              [p.name, p.category, p.brand, p.stock, p.status]
            );
            added.push(p.name);
          }
        }
        fs.unlinkSync(file.path);
        res.json({ added: added.length, skipped });
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
