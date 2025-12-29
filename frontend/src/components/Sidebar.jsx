import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Image as ImageIcon,
  Boxes,
  Users,
  Sun,
  Moon,
  LogOut,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import "./css/sidebar.css";

export default function Sidebar({ open, onClose }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    onClose();            // 1️⃣ cerramos sidebar
    logout();             // 2️⃣ limpiamos sesión
    navigate("/login");   // 3️⃣ navegamos
  };

  const links = [
    { to: "/dashboard", label: "Inicio", icon: <Home size={18} /> },
    { to: "/products", label: "Productos", icon: <Boxes size={18} /> },
    { to: "/flyers", label: "Flyers", icon: <ImageIcon size={18} /> },
    { to: "/ranking", label: "Ranking", icon: <Users size={18} /> },
    { to: "/cnc", label: "CCC", icon: <Users size={18} /> },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* OVERLAY */}
          <motion.div
            className="sidebar-overlay"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* SIDEBAR */}
          <motion.aside
            className="sidebar"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            {/* HEADER */}
            <div className="sidebar-header">
              <div className="sidebar-brand">
                <img src="/logo-panella.png" alt="Grupo Panella" />
                <span>GRUPO PANELLA</span>
              </div>

              <button className="sidebar-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            {/* LINKS */}
            <nav className="sidebar-links">
              {links.map((item) => {
                const active = pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`sidebar-link ${active ? "active" : ""}`}
                    onClick={onClose}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* FOOTER */}
            <div className="sidebar-footer">
              <button className="sidebar-btn" onClick={toggleTheme}>
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                {theme === "dark" ? "Modo claro" : "Modo oscuro"}
              </button>

              <button
                className="sidebar-btn danger"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
