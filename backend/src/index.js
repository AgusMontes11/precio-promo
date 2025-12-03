import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import productRoutes from './routes/products.js';
import promotionRoutes from './routes/promotions.js';
import statsRoutes from "./routes/stats.js";   // << IMPORTANTE
import { upload } from "./upload.js";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// Servir imágenes desde la carpeta uploads
app.use("/uploads", express.static(path.resolve("uploads")));

// RUTAS API
app.use('/api/products', productRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/stats', statsRoutes);           // << MOVIDO AQUÍ

// Subida de imágenes
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "No se subió un archivo" });

  res.json({
    success: true,
    file: "/uploads/" + req.file.filename,
  });
});

// TESTEAR CONEXIÓN
pool.query('SELECT NOW()')
  .then(() => console.log('DB conectada a PostgreSQL'))
  .catch(err => console.error('ERROR conectando a la DB:', err.message));

// INICIAR SERVIDOR
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));
