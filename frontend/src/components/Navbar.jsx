import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Image as ImageIcon, Boxes, Sun, Moon, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./navbar.css";

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // ---- THEME SYSTEM ----
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = [
    { to: "/dashboard", label: "Inicio", icon: <Home size={20} /> },
    { to: "/flyers", label: "Flyers", icon: <ImageIcon size={20} /> },
    { to: "/products", label: "Productos", icon: <Boxes size={20} /> },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }} // ✅ delay clave
      className="pro-navbar"
    >
      <div className="nav-inner d-flex align-items-center position-relative">

        {/* LEFT — LOGO */}
        <div className="nav-left">
          <Link to="/dashboard" className="logo-link d-flex align-items-center">
            <div className="logo-wrapper">
              <img
                src="/logo-panella.png"
                alt="Logo Grupo Panella"
                className="nav-logo"
              />
            </div>
            <span className="brand-title">GRUPO PANELLA</span>
          </Link>
        </div>

        {/* CENTER — MENU CENTRADO */}
        <div className="nav-center position-absolute start-50 translate-middle-x d-flex align-items-center gap-3">
          {links.map((item) => {
            const active = pathname.startsWith(item.to);

            return (
              <Link key={item.to} to={item.to} className="nav-link">
                <motion.div
                  whileHover={{ scale: 1.08, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  className={`nav-item ${active ? "active" : ""}`}
                >
                  <div className="icon">{item.icon}</div>
                  <span>{item.label}</span>

                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="active-indicator"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 25,
                      }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* RIGHT — THEME + LOGOUT */}
        <div className="nav-right ms-auto d-flex align-items-center gap-2">

          {/* BOTÓN TEMA */}
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            className="btn btn-outline-dark d-flex align-items-center gap-2 px-3 py-1"
            style={{
              borderRadius: 10,
              background: "var(--nav-btn-bg)",
              border: "1px solid var(--nav-btn-border)",
              color: "var(--nav-btn-text)",
              fontSize: 13,
            }}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {theme === "dark" ? "Modo claro" : "Modo oscuro"}
          </motion.button>

          {/* ✅ BOTÓN CERRAR SESIÓN */}
          <motion.button
            onClick={handleLogout}
            whileTap={{ scale: 0.9 }}
            className="btn btn-outline-danger d-flex align-items-center gap-2 px-3 py-1"
            style={{
              borderRadius: 10,
              fontSize: 13,
            }}
          >
            <LogOut size={16} />
            Salir
          </motion.button>

        </div>
      </div>
    </motion.nav>
  );
}
