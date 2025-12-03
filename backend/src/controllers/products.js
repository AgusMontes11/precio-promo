import { pool } from '../db.js';

// ✅ GET ALL
export const getAll = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ CREATE (CORREGIDO PARA TU TABLA REAL)
export const create = async (req, res) => {
  try {
    const { name, price, imageurl } = req.body;

    const result = await pool.query(
      `INSERT INTO products (name, price, imageurl)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, price, imageurl]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("ERROR CREATE:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ GET BY ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM products WHERE id=$1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ UPDATE (CORREGIDO)
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, imageurl } = req.body;

    const result = await pool.query(
      `UPDATE products 
       SET name=$1, price=$2, imageurl=$3
       WHERE id=$4
       RETURNING *`,
      [name, price, imageurl, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("ERROR UPDATE:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ DELETE
export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM products WHERE id=$1', [id]);

    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
