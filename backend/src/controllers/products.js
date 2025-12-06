import { pool } from '../db.js';

// -------------------------------------
// HELPERS PARA JSON SEGURO
// -------------------------------------
function safeParse(json) {
  try {
    if (!json) return [];
    if (typeof json === "object") return json;
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function fixProduct(p) {
  return {
    ...p,
    discount_tiers: safeParse(p.discount_tiers),
    has_tiers: p.has_tiers === true,
  };
}

// =====================================================
// GET ALL
// =====================================================
export const getAll = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id ASC");
    res.json(result.rows.map(fixProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// =====================================================
// GET BY ID
// =====================================================
export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Producto no encontrado" });

    res.json(fixProduct(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// =====================================================
// CREATE
// =====================================================
export const create = async (req, res) => {
  try {
    const {
      name,
      price,
      imageurl,
      category,
      hasTiers,
      discountTiers,
    } = req.body;

    // 🔥 Normalizamos Tiers (si vienen como strings, los parseamos)
    const finalTiers = Array.isArray(discountTiers)
      ? discountTiers.map((t) => (typeof t === "string" ? JSON.parse(t) : t))
      : [];

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
        JSON.stringify(finalTiers),
      ]
    );

    res.json(fixProduct(result.rows[0]));
  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// =====================================================
// UPDATE (VERSION 100% ROBUSTA)
// =====================================================
export const update = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      price,
      imageurl,
      category,
      hasTiers,
      discountTiers,
    } = req.body;

    // Traemos el producto actual
    const existing = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0)
      return res.status(404).json({ error: "Producto no encontrado" });

    const current = existing.rows[0];

    // 🔥 REGLA DE ORO:
    // Si NO vino discountTiers en el body → NO lo tocamos.
    let finalTiers =
      discountTiers !== undefined
        ? discountTiers.map((t) =>
            typeof t === "string" ? JSON.parse(t) : t
          )
        : safeParse(current.discount_tiers);

    const result = await pool.query(
      `
      UPDATE products
      SET 
        name = $1,
        price = $2,
        imageurl = $3,
        category = $4,
        has_tiers = $5,
        discount_tiers = $6
      WHERE id = $7
      RETURNING *
      `,
      [
        name ?? current.name,
        price ?? current.price,
        imageurl ?? current.imageurl,
        category ?? current.category,
        hasTiers ?? current.has_tiers,
        JSON.stringify(finalTiers),
        id,
      ]
    );

    res.json(fixProduct(result.rows[0]));
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// =====================================================
// DELETE
// =====================================================
export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    res.json({ message: "Producto eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
