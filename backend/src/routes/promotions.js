import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// Crear la tabla si no existe
const createTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS promotions (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id),
      description VARCHAR(255),
      discount_percentage INTEGER
    );
  `);
};

router.post('/', async (req, res) => {
  try {
    await createTable();

    const { product_id, description, discount_percentage } = req.body;

    const result = await pool.query(
      `INSERT INTO promotions (product_id, description, discount_percentage)
       VALUES ($1, $2, $3) RETURNING *`,
      [product_id, description, discount_percentage]
    );

    res.json({
      message: 'Promoción creada',
      promotion: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando promoción' });
  }
});

export default router;
