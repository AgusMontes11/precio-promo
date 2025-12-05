import { pool } from '../db.js';

// ==========================================================
// Helper: normaliza un producto desde la DB
// ==========================================================
const fixProduct = (p) => {
  let tiers = [];

  try {
    // Si viene null o vacío → lo dejamos como []
    if (!p.discount_tiers || p.discount_tiers.trim() === "") {
      tiers = [];
    }
    // Si viene string JSON → parsearlo
    else if (typeof p.discount_tiers === "string") {
      tiers = JSON.parse(p.discount_tiers);
    }
    // Si ya viene array → usarlo
    else if (Array.isArray(p.discount_tiers)) {
      tiers = p.discount_tiers;
    }
  } catch (e) {
    console.error("Error parseando discount_tiers:", p.discount_tiers);
    tiers = [];
  }

  return {
    ...p,
    has_tiers: p.has_tiers ?? false,
    discount_tiers: tiers
  };
};


// =============================
// GET ALL
// =============================
export const getAll = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id ASC"
    );

    const fixed = result.rows.map(fixProduct);
    res.json(fixed);

  } catch (err) {
    console.error(err);
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
      "SELECT * FROM products WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const fixed = fixProduct(result.rows[0]);
    res.json(fixed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ==========================================================
// CREATE
// ==========================================================
export const create = async (req, res) => {
  try {
    const {
      name,
      price,
      imageurl,
      category,
      hasTiers,
      discountTiers
    } = req.body;

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

    res.json(fixProduct(result.rows[0]));

  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ==========================================================
// UPDATE
// ==========================================================
export const update = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      price,
      imageurl,
      category,
      hasTiers,
      discountTiers
    } = req.body;

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

    res.json(fixProduct(result.rows[0]));

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ==========================================================
// DELETE
// ==========================================================
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
