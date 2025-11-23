const db = require('../../database/db');

const columns = 'id, name, unit, category, brand, stock, status, image, created_at, updated_at';

async function getAll({ page, limit, sortBy, order, search } = {}) {
  let sql = `SELECT ${columns} FROM products`;
  const params = [];

  if (search) {
    sql += ` WHERE LOWER(name) LIKE ?`;
    params.push(`%${search.toLowerCase()}%`);
  }

  if (sortBy) {
    const safeSort = ['id','name','stock','category','updated_at'].includes(sortBy) ? sortBy : 'id';
    const dir = (order && order.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${safeSort} ${dir}`;
  } else {
    sql += ` ORDER BY id DESC`;
  }

  if (limit) {
    const l = Number(limit) || 20;
    const p = Number(page) || 1;
    const offset = (p - 1) * l;
    sql += ` LIMIT ${l} OFFSET ${offset}`;
  }

  return db.all(sql, params);
}

async function getById(id) {
  return db.get(`SELECT ${columns} FROM products WHERE id = ?`, [id]);
}

async function findByName(name) {
  return db.get(`SELECT id FROM products WHERE LOWER(name)=LOWER(?)`, [name]);
}

async function findByNameExcludingId(name, id) {
  return db.get(`SELECT id FROM products WHERE LOWER(name)=LOWER(?) AND id != ?`, [name, id]);
}

async function create(p) {
  return db.run(
    `INSERT INTO products (name, unit, category, brand, stock, status, image)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [p.name, p.unit || 'pcs', p.category || 'uncategorized', p.brand || '', Number(p.stock || 0), (Number(p.stock||0) > 0 ? 'in_stock' : 'out_of_stock'), p.image || '']
  );
}

async function update(id, p) {
  return db.run(
    `UPDATE products SET name=?, unit=?, category=?, brand=?, stock=?, status=?, image=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    [p.name, p.unit, p.category, p.brand || '', Number(p.stock), p.status || (Number(p.stock) > 0 ? 'in_stock' : 'out_of_stock'), p.image || '', id]
  );
}

async function remove(id) {
  return db.run(`DELETE FROM products WHERE id=?`, [id]);
}

module.exports = {
  getAll,
  getById,
  findByName,
  findByNameExcludingId,
  create,
  update,
  remove
};
