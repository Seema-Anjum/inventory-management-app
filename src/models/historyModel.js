const db = require('../../database/db');

async function createLog(productId, oldQ, newQ, changedBy = 'admin') {
  return db.run(
    `INSERT INTO inventory_history (product_id, old_quantity, new_quantity, changed_by, change_date)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [productId, Number(oldQ), Number(newQ), changedBy]
  );
}

async function getByProductId(productId) {
  return db.all(
    `SELECT id, product_id, old_quantity, new_quantity, changed_by, change_date
     FROM inventory_history WHERE product_id = ? ORDER BY change_date DESC`,
    [productId]
  );
}

module.exports = { createLog, getByProductId };
