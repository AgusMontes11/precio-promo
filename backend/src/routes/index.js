const express = require("express");
const router = express.Router();

const productsRoutes = require("./products");
const promotionsRoutes = require("./promotions");
const uploadRoutes = require("./upload");
const statsRoutes = require("./stats"); // NUEVA RUTA

router.use("/products", productsRoutes);
router.use("/promotions", promotionsRoutes);
router.use("/upload", uploadRoutes);
router.use("/stats", statsRoutes); // AGREGA ESTO

module.exports = router;
