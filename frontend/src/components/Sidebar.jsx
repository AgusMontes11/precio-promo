// src/components/Sidebar.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Boxes, Image as ImageIcon, Settings } from "lucide-react";
import "./navbar.css"; // shares styles for palette

export default function Sidebar({ collapsed, onHoverCollapse }) {
  const { pathname } = useLocation();
  const links = [
    { to: "/dashboard", label: "Inicio", icon: <Home size={18} /> },
    { to: "/products", label: "Productos", icon: <Boxes size={18} /> },
    { to: "/flyers", label: "Flyers", icon: <ImageIcon size={18} /> },
    { to: "/settings", label: "Ajustes", icon: <Settings size={18} /> },
  ];

  return (
    <motion.aside
      onMouseEnter={() => onHoverCollapse && onHoverCollapse(false)}
      onMouseLeave={() => onHoverCollapse && onHoverCollapse(true)}
      animate={{ width: collapsed ? 68 : 220 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className={`pro-sidebar ${collapsed ? "collapsed" : ""}`}
    >
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="logo">📦</div>
          {!collapsed && <div className="brand-name">Panella Manager</div>}
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map((l) => {
          const active = pathname === l.to;
          return (
            <Link key={l.to} to={l.to} className={`sidebar-link ${active ? "active" : ""}`}>
              <div className="link-icon">{l.icon}</div>
              {!collapsed && <div className="link-label">{l.label}</div>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && <div className="small-muted">v1.0 — Admin</div>}
      </div>
    </motion.aside>
  );
}
