const fs = require('fs');
const path = require('path');
const Product = require('../models/productModel');
const History = require('../models/historyModel');
const { parseCsvFile, streamCsvToResponse } = require('../utils/csvUtils');

// GET /api/products
async function getProducts(req, res, next) {
  try {
    const { page, limit, sortBy, order, search } = req.query;
    const rows = await Product.getAll({ page, limit, sortBy, order, search });
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /api/products/search?name=...
async function searchProducts(req, res, next) {
  try {
    const q = req.query.name || req.query.q || '';
    if (!q) return getProducts(req, res, next);
    const rows = await Product.getAll({ search: q });
    res.json(rows);
  } catch (err) { next(err); }
}

// PUT /api/products/:id
async function updateProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name, unit, category, brand, stock, status, image, changedBy } = req.body;

    const existing = await Product.findByNameExcludingId(name, id);
    if (existing) return res.status(400).json({ error: 'Name already exists' });

    const old = await Product.getById(id);
    if (!old) return res.status(404).json({ error: 'Product not found' });

    // Update product
    await Product.update(id, { name, unit, category, brand, stock, status, image });

    // Log inventory change if stock changed
    if (Number(old.stock) !== Number(stock)) {
      await History.createLog(id, old.stock, stock, changedBy || 'admin');
    }

    const updated = await Product.getById(id);
    res.json(updated);
  } catch (err) { next(err); }
}

// DELETE /api/products/:id
async function deleteProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    await Product.remove(id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

// POST /api/products/import
async function importCSV(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'csvFile required' });
    const filePath = req.file.path;
    const rows = await parseCsvFile(filePath);

    const added = [];
    const skipped = [];
    const duplicates = [];

    for (const r of rows) {
      const name = (r.name || '').trim();
      if (!name) { skipped.push({ row: r, reason: 'missing name' }); continue; }

      const exists = await Product.findByName(name);
      if (exists) {
        duplicates.push({ name, existingId: exists.id });
        continue;
      }

      try {
        await Product.create({
          name,
          unit: r.unit || 'pcs',
          category: r.category || 'uncategorized',
          brand: r.brand || '',
          stock: Number(r.stock || 0),
          image: r.image || ''
        });
        added.push(name);
      } catch (e) {
        skipped.push({ row: r, reason: e.message });
      }
    }

    // Cleanup uploaded file
    try { fs.unlinkSync(filePath); } catch(e){ /* ignore */ }

    res.json({ added: added.length, skipped: skipped.length, duplicates });
  } catch (err) { next(err); }
}

// GET /api/products/export
async function exportCSV(req, res, next) {
  try {
    const rows = await Product.getAll({});
    // Map rows to CSV-friendly objects
    const csvRows = rows.map(r => ({
      id: r.id,
      name: r.name,
      unit: r.unit,
      category: r.category,
      brand: r.brand,
      stock: r.stock,
      status: r.status,
      image: r.image
    }));
    const headers = ['id','name','unit','category','brand','stock','status','image'];
    streamCsvToResponse(csvRows, res, headers);
  } catch (err) { next(err); }
}

// GET /api/products/:id/history
async function getHistory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const rows = await History.getByProductId(id);
    res.json(rows);
  } catch (err) { next(err); }
}

module.exports = {
  getProducts,
  searchProducts,
  updateProduct,
  deleteProduct,
  importCSV,
  exportCSV,
  getHistory
};
