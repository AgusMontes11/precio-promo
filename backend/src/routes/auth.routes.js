import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Faltan email o password" });
    }

    // ✅ TABLA Y CAMPOS CORRECTOS
    const result = await pool.query(
      "SELECT id, nombre, email, password, rol FROM usuarios WHERE email = $1 AND activo = true",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const user = result.rows[0];

    // ✅ Comparación segura (hash o texto plano)
    const isValid =
      user.password === password ||
      (await bcrypt.compare(password, user.password));

    if (!isValid) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    // ✅ Token con rol real
    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (err) {
    console.error("❌ Error en /api/auth/login:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
