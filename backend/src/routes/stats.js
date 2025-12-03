import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// 🟦 TOTAL DE PRODUCTOS
router.get("/products", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT COUNT(*) AS total FROM products");
    res.json({ totalProducts: rows[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo total de productos" });
  }
});

// 🟪 TOTAL DE FLYERS GENERADOS
router.get("/flyers", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM stats WHERE name = 'flyers_generated'"
    );

    const total = rows.length ? rows[0].value : 0;

    res.json({ flyersGenerated: total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo total de flyers" });
  }
});

// 🔹 INCREMENTAR TOTAL DE FLYERS
router.post("/flyers/increment", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM stats WHERE name = 'flyers_generated'"
    );

    if (rows.length) {
      await pool.query(
        "UPDATE stats SET value = value + 1 WHERE name = 'flyers_generated'"
      );
    } else {
      await pool.query(
        "INSERT INTO stats(name, value) VALUES('flyers_generated', 1)"
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error incrementando total de flyers" });
  }
});

export default router;
