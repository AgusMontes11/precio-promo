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
import { upload } from "./uploadCloudinary.js";

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

// ❌ YA NO USAMOS /uploads CON CLOUDINARY
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas API
app.use("/api/products", productRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/stats", statsRoutes);

// ✅ Upload con Cloudinary
app.post("/api/upload", upload.single("image"), (req, res) => {
  res.json({
    success: true,
    file: req.file.path, // ✅ URL real de Cloudinary
  });
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
