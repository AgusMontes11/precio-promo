import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { pool } from "./db.js";
import productRoutes from "./routes/products.js";
import promotionRoutes from "./routes/promotions.js";
import statsRoutes from "./routes/stats.js";
import { upload } from "./upload.js";

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

app.use(express.json());

// Carpeta estática para imágenes
app.use("/uploads", express.static(path.resolve("uploads")));

// Rutas API
app.use("/api/products", productRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/stats", statsRoutes);

// Upload de imágenes
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se subió un archivo" });
  }

  res.json({
    success: true,
    file: "/uploads/" + req.file.filename,
  });
});

// Test DB
pool.query("SELECT NOW()")
  .then(() => console.log("DB conectada a PostgreSQL"))
  .catch(err => console.error("ERROR conectando a la DB:", err.message));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));

app.get("/", (req, res) => {
  res.send("Backend funcionando OK");
});
