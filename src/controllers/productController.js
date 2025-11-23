const { db, run, get, all } = require("../../database/db");
const fs = require("fs");
const csv = require("csv-parser");
const { Parser } = require("json2csv");

// Get all products
async function getProducts(req, res) {
  try {
    const products = await all("SELECT * FROM products");
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Create product
async function createProduct(req, res) {
  try {
    const { name, category, brand, stock, status } = req.body;
    const result = await run(
      "INSERT INTO products (name, category, brand, stock, status) VALUES (?, ?, ?, ?, ?)",
      [name, category, brand, stock, status]
    );
    res.json({ id: result.lastID, name, category, brand, stock, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Update product + track inventory history
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, category, brand, stock, status } = req.body;

    const oldProduct = await get("SELECT * FROM products WHERE id=?", [id]);
    if (!oldProduct) return res.status(404).json({ error: "Product not found" });

    await run(
      "UPDATE products SET name=?, category=?, brand=?, stock=?, status=? WHERE id=?",
      [name, category, brand, stock, status, id]
    );

    // Track inventory history if stock changed
    if (oldProduct.stock !== stock) {
      await run(
        "INSERT INTO inventory_history (product_id, old_quantity, new_quantity, change_date) VALUES (?, ?, ?, ?)",
        [id, oldProduct.stock, stock, new Date().toISOString()]
      );
    }

    res.json({ id, name, category, brand, stock, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Delete product
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    await run("DELETE FROM products WHERE id=?", [id]);
    res.json({ deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Search products
async function searchProducts(req, res) {
  try {
    const { name } = req.query;
    const products = await all(
      "SELECT * FROM products WHERE name LIKE ?",
      [`%${name}%`]
    );
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get product inventory history
async function getHistory(req, res) {
  try {
    const { id } = req.params;
    const history = await all(
      "SELECT * FROM inventory_history WHERE product_id=? ORDER BY change_date DESC",
      [id]
    );
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Export products CSV
async function exportCSV(req, res) {
  try {
    const products = await all("SELECT * FROM products");
    const parser = new Parser();
    const csvData = parser.parse(products);
    res.header("Content-Type", "text/csv");
    res.attachment("products.csv");
    res.send(csvData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Import CSV
async function importCSV(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const products = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => products.push(row))
      .on("end", async () => {
        let added = 0;
        for (const p of products) {
          const exists = await get("SELECT id FROM products WHERE name=?", [p.name]);
          if (!exists) {
            await run(
              "INSERT INTO products (name, category, brand, stock, status) VALUES (?, ?, ?, ?, ?)",
              [p.name, p.category, p.brand, p.stock, p.status]
            );
            added++;
          }
        }
        res.json({ added, total: products.length });
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getHistory,
  exportCSV,
  importCSV,
};
