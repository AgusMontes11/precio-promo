import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Boxes,
  Image as ImageIcon,
  Medal,
  ArrowRight,
  ClipboardList,
  Users,
} from "lucide-react";
import "./css/dashboard.css";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

function capitalizeName(name = "") {
  return name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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

  return <span className="animated-number">{display}</span>;
}

export default function Dashboard() {
  const [totalProducts, setTotalProducts] = useState(null);
  const [flyersGenerated, setFlyersGenerated] = useState(0);
  const MotionDiv = motion.div;

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

  const { user, role } = useAuth();

  return (
    <MotionDiv
      className="dashboard-container fade-in"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="dashboard-header">
        <h1>
          Hola,
          {user?.nombre_promotor && (
            <span> {capitalizeName(user.nombre_promotor)}</span>
          )}
        </h1>

        <p>Gestioná tus productos, generá flyers y administrá tu catálogo.</p>
      </div>
      {/* QUICK CARDS */}
      <div className="quick-actions">
        {role === "admin" ? (
          <>
            <Link to="/plan-comercial" className="quick-card">
              <MotionDiv
                className="quick-card-inner"
                whileHover={{ scale: 1.04 }}
              >
                <ClipboardList size={32} />
                <h3>Plan Comercial</h3>
                <p>Acciones Matinal y Vespertina.</p>
                <div className="quick-go">
                  Ir <ArrowRight size={16} />
                </div>
              </MotionDiv>
            </Link>

            <Link to="/cnc" className="quick-card">
              <MotionDiv
                className="quick-card-inner"
                whileHover={{ scale: 1.04 }}
              >
                <Users size={32} />
                <h3>Acciones CNC UNG</h3>
                <p>Clientes no compradores del dia.</p>
                <div className="quick-go">
                  Ir <ArrowRight size={16} />
                </div>
              </MotionDiv>
            </Link>

            <Link to="/ranking" className="quick-card">
              <MotionDiv
                className="quick-card-inner"
                whileHover={{ scale: 1.04 }}
              >
                <Medal size={32} />
                <h3>Ranking</h3>
                <p>Seguimiento de desempeño y objetivos.</p>
                <div className="quick-go">
                  Ir <ArrowRight size={16} />
                </div>
              </MotionDiv>
            </Link>
          </>
        ) : (
          <>
            <Link to="/products" className="quick-card">
              <MotionDiv
                className="quick-card-inner"
                whileHover={{ scale: 1.04 }}
              >
                <Boxes size={32} />
                <h3>Productos</h3>
                <p>Agregá, editá o eliminá productos.</p>
                <div className="quick-go">
                  Ir <ArrowRight size={16} />
                </div>
              </MotionDiv>
            </Link>

            <Link to="/flyers" className="quick-card">
              <MotionDiv
                className="quick-card-inner"
                whileHover={{ scale: 1.04 }}
              >
                <ImageIcon size={32} />
                <h3>Flyers</h3>
                <p>Generá flyers con diseño profesional.</p>
                <div className="quick-go">
                  Ir <ArrowRight size={16} />
                </div>
              </MotionDiv>
            </Link>

            <Link to="/ranking" className="quick-card">
              <MotionDiv
                className="quick-card-inner"
                whileHover={{ scale: 1.04 }}
              >
                <Medal size={32} />
                <h3>Ranking</h3>
                <p>Seguimiento de desempeño y objetivos.</p>
                <div className="quick-go">
                  Ir <ArrowRight size={16} />
                </div>
              </MotionDiv>
            </Link>
          </>
        )}
      </div>
      {/* STATS */}
      <h2 className="stats-title">Estadísticas</h2>
      <div className="stats-grid">
        <MotionDiv className="stat-box" whileHover={{ scale: 1.03 }}>
          <h4>Total de productos</h4>
          <span>
            {totalProducts !== null ? (
              <AnimatedNumber value={totalProducts} />
            ) : (
              "—"
            )}
          </span>
        </MotionDiv>

        <MotionDiv className="stat-box" whileHover={{ scale: 1.03 }}>
          <h4>Flyers generados</h4>
          <span>
            <AnimatedNumber value={flyersGenerated} />
          </span>
        </MotionDiv>
      </div>
    </MotionDiv>
  );
}
