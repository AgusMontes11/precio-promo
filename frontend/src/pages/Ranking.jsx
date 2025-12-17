import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./css/ranking.css";

const WORKER_URL =
  "https://backend-nuevo.montesagus2001.workers.dev/ranking";

export default function Ranking() {
  const [mode, setMode] = useState(
    () => localStorage.getItem("rankingMode") || "actual"
  );

  const [data, setData] = useState(null);

  // loader SOLO la primera vez que entrás a /ranking
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // dirección para la animación (se calcula fuera del render)
  const [direction, setDirection] = useState(1);
  const prevModeRef = useRef(mode);

  // persistir modo
  useEffect(() => {
    localStorage.setItem("rankingMode", mode);
  }, [mode]);

  // calcular dirección al cambiar de modo (FUERA del render)
  useEffect(() => {
    const prev = prevModeRef.current;

    let dir = 0;
    if (prev === "actual" && mode === "cza") dir = 1;
    if (prev === "cza" && mode === "actual") dir = -1;

    setDirection(dir);
    prevModeRef.current = mode;
  }, [mode]);

  // fetch datos según modo (sin poner data=null al cambiar, así no hay loader)
  useEffect(() => {
    const sheet = mode === "actual" ? "RankingUng" : "RankingCza";

    fetch(`${WORKER_URL}?sheet=${encodeURIComponent(sheet)}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setIsInitialLoad(false);
      })
      .catch(() => {
        setData({ error: true });
        setIsInitialLoad(false);
      });
  }, [mode]);

  // loader SOLO al entrar por primera vez
  if (isInitialLoad && !data) {
    return (
      <div className="ranking-loading">
        <div className="loader" />
        <span>Cargando ranking</span>
      </div>
    );
  }

  if (data?.error) {
    return <div className="ranking-loading">Error cargando ranking</div>;
  }

  const { promotores = [], supervisores = [] } = data || {};

  const getClassByAlcance = (alcance) => {
    const n = parseInt(alcance);
    if (n >= 70) return "ok";
    if (n >= 55) return "warn";
    return "bad";
  };

  const renderTable = (rows, title) => (
    <div className="ranking-section">
      <h2>{title}</h2>

      <div className="ranking-table-wrapper">
        <table className="ranking-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>CCC</th>
              <th>Universo</th>
              <th>Alcance</th>
              <th>Objetivo</th>
              <th>Faltan</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="name">{r.promotor || r.supervisor}</td>
                <td>{r.ccc}</td>
                <td>{r.universo}</td>
                <td className={getClassByAlcance(r.alcance)}>{r.alcance}</td>
                <td>{r.objetivo}</td>
                <td>{r.faltan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="ranking-container">
      <div className="ranking-content">
        {/* HERO HEADER */}
        <div className="ranking-hero">
          <div className="ranking-hero-switch">
            <h2 className={mode === "actual" ? "active" : ""}>RANKING UNG</h2>

            <button
              className={`hero-switch ${mode === "cza" ? "right" : "left"}`}
              onClick={() => setMode((m) => (m === "actual" ? "cza" : "actual"))}
            >
              <div className="hero-knob" />
            </button>

            <h2 className={mode === "cza" ? "active" : ""}>RANKING CERVEZA</h2>
          </div>
        </div>

        {/* CONTENT ANIMADO */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 40 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 * direction }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="ranking-grid">
              <div className="ranking-col">{renderTable(promotores, "Promotores")}</div>
              <div className="ranking-col">{renderTable(supervisores, "Supervisores")}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
