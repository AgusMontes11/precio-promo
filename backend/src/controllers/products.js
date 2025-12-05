import { pool } from '../db.js';

// =============================
// GET ALL
// =============================
export const getAll = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// =============================
// CREATE
// =============================
export const create = async (req, res) => {
  try {
    const { name, price, imageurl, category, hasTiers, discountTiers } = req.body;

    const result = await pool.query(
      `INSERT INTO products (name, price, imageurl, category, has_tiers, discount_tiers)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
       [
         name,
         price,
         imageurl,
         category ?? null,
         hasTiers ?? false,
         JSON.stringify(discountTiers || [])
       ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// =============================
// GET BY ID
// =============================
export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// =============================
// UPDATE
// =============================
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, imageurl, category, hasTiers, discountTiers } = req.body;

    const result = await pool.query(
      `UPDATE products 
       SET name = $1,
           price = $2,
           imageurl = $3,
           category = $4,
           has_tiers = $5,
           discount_tiers = $6
       WHERE id = $7
       RETURNING *`,
      [
        name,
        price,
        imageurl,
        category ?? null,
        hasTiers ?? false,
        JSON.stringify(discountTiers || []),
        id
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// =============================
// DELETE
// =============================
export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
