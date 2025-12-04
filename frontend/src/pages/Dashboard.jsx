import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Boxes, Image as ImageIcon, Sparkles, ArrowRight } from "lucide-react";
import "./dashboard.css";
import { Link } from "react-router-dom";
import api from "../services/api";

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    let end = value;
    let duration = 1200;
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      const current = Math.floor(start + (end - start) * progress);
      setDisplay(current);

      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [value]);

  return (
    <span className="animated-number">{display}</span>
  );
}

export default function Dashboard() {
  const [totalProducts, setTotalProducts] = useState(null);
  const [flyersGenerated, setFlyersGenerated] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resProducts = await api.get("/stats/products");
        setTotalProducts(resProducts.data.totalProducts || 0);

        const resFlyers = await api.get("/stats/flyers");
        setFlyersGenerated(resFlyers.data.flyersGenerated || 0);
      } catch (error) {
        console.log("Error obteniendo estadísticas", error);
      }
    };

    fetchStats();

    const handler = () => fetchStats();
    window.addEventListener("flyer-generated", handler);
    return () => window.removeEventListener("flyer-generated", handler);
  }, []);

  return (
    <motion.div
      className="dashboard-container fade-in"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* HEADER */}
      <div className="dashboard-header">
        <h1>Panel Principal</h1>
        <p>Gestioná tus productos, generá flyers y administrá tu catálogo.</p>
      </div>

      {/* QUICK CARDS */}
      <div className="quick-actions">
        <Link to="/products" className="quick-card">
          <motion.div className="quick-card-inner" whileHover={{ scale: 1.04 }}>
            <Boxes size={32} />
            <h3>Productos</h3>
            <p>Agregá, editá o eliminá productos.</p>
            <div className="quick-go">Ir <ArrowRight size={16} /></div>
          </motion.div>
        </Link>

        <Link to="/flyers" className="quick-card">
          <motion.div className="quick-card-inner" whileHover={{ scale: 1.04 }}>
            <ImageIcon size={32} />
            <h3>Flyers</h3>
            <p>Generá flyers con diseño profesional.</p>
            <div className="quick-go">Ir <ArrowRight size={16} /></div>
          </motion.div>
        </Link>

        <div className="quick-card disabled">
          <motion.div className="quick-card-inner">
            <Sparkles size={32} />
            <h3>Próximamente</h3>
            <p>Nuevas funciones en camino.</p>
            <div className="quick-go"><ArrowRight size={16} /></div>
          </motion.div>
        </div>
      </div>

      {/* STATS */}
      <h2 className="stats-title">Estadísticas</h2>

      <div className="stats-grid">
        <motion.div className="stat-box" whileHover={{ scale: 1.03 }}>
          <h4>Total de productos</h4>
          <span>
            {totalProducts !== null ? (
              <AnimatedNumber value={totalProducts} />
            ) : "—"}
          </span>
        </motion.div>

        <motion.div className="stat-box" whileHover={{ scale: 1.03 }}>
          <h4>Flyers generados</h4>
          <span>
            <AnimatedNumber value={flyersGenerated} />
          </span>
        </motion.div>

        <motion.div className="stat-box" whileHover={{ scale: 1.03 }}>
          <h4>Actualizaciones pendientes</h4>
          <span>0</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
