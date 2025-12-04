import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { pool } from "./db.js";
import productRoutes from "./routes/products.js";
import promotionRoutes from "./routes/promotions.js";
import statsRoutes from "./routes/stats.js";
import authRoutes from "./routes/auth.routes.js";
import { upload, uploadToCloudinary } from "../uploadCloudinary.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

// Rutas API
app.use("/api/products", productRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/auth", authRoutes); 

// ✅ Upload con Cloudinary
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ningún archivo" });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    res.json({
      success: true,
      file: result.secure_url, // ✅ URL REAL DE CLOUDINARY
    });
  } catch (err) {
    console.error("❌ ERROR EN CLOUDINARY:", err);
    res.status(500).json({
      error: "Error subiendo a Cloudinary",
      details: err.message,
    });
  }
});

// Test DB
pool
  .query("SELECT NOW()")
  .then(() => console.log("DB conectada a PostgreSQL"))
  .catch((err) => console.error("ERROR conectando a la DB:", err.message));

app.get("/", (req, res) => {
  res.send("Backend funcionando OK");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));
