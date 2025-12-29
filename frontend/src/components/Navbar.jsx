// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Image as ImageIcon,
  Users,
  Boxes,
  Sun,
  Moon,
  LogOut,
  Menu,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

// 👇 USAMOS TU ARCHIVO EXISTENTE
import { getPromotorImageByUser } from "../constants/promotorImages";

import "./css/navbar.css";

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth(); // 👈 asumimos user disponible

  /* =========================
     THEME
  ========================= */

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

  /* =========================
     LINKS
  ========================= */

  const links = [
    { to: "/dashboard", label: "Inicio", icon: <Home size={20} /> },
    { to: "/flyers", label: "Flyers", icon: <ImageIcon size={20} /> },
    { to: "/products", label: "Productos", icon: <Boxes size={20} /> },
    { to: "/cnc", label: "CNC", icon: <Users size={20} /> },
  ];

  /* =========================
     SIDEBAR (MOBILE)
  ========================= */

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="pro-navbar"
      >
        <div className="nav-inner d-flex align-items-center position-relative">
          {/* =========================
              MOBILE — HAMBURGER
          ========================= */}
          <button
            className="d-lg-none ms-3"
            onClick={() => setSidebarOpen(true)}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
            }}
          >
            <Menu size={26} />
          </button>

          {/* =========================
              LEFT — LOGO
          ========================= */}
          <div className="nav-left">
            <Link
              to="/dashboard"
              className="logo-link d-flex align-items-center"
            >
              <div className="logo-wrapper">
                <img
                  src="/logo-panella.png"
                  alt="Logo Grupo Panella"
                  className="nav-logo"
                />
              </div>
              <span className="brand-title d-none d-sm-inline">
                GRUPO PANELLA
              </span>
            </Link>
          </div>

          {/* =========================
              CENTER — DESKTOP MENU
          ========================= */}
          <div className="nav-center d-none d-lg-flex position-absolute start-50 translate-middle-x gap-3">
            {links.map((item) => {
              const active = pathname.startsWith(item.to);

              return (
                <Link key={item.to} to={item.to} className="nav-link">
                  <motion.div
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.95 }}
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

          {/* =========================
              RIGHT — DESKTOP ACTIONS
          ========================= */}
          <div className="nav-right ms-auto d-none d-lg-flex align-items-center gap-2">
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

          {/* =========================
              RIGHT — MOBILE USER AVATAR
          ========================= */}
          <div className="d-lg-none ms-auto me-3">
            <img
              src={getPromotorImageByUser(user)}
              alt={user?.nombre_promotor}
              className="nav-user-avatar"
            />
          </div>
        </div>
      </motion.nav>

      {/* =========================
          SIDEBAR (MOBILE)
      ========================= */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </>
  );
}
