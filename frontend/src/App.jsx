// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import ProductsPage from "./pages/ProductsPage";
import ProductForm from "./components/ProductForm";
import FlyerBuilder from "./pages/FlyerBuilder";
import PromotionBuilder from "./components/PromotionBuilder";


import "./styles.css"; // global styles (si ya lo tenés, mantenelo)

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<Dashboard />} />

        {/* Productos (página única e integrada) */}
        <Route path="/products" element={<ProductsPage />} />

        <Route path="/promos" element={<PromotionBuilder />} />


        {/* Rutas directas al form (opcional) */}
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id/edit" element={<ProductForm />} />

        {/* Flyers */}
        <Route path="/flyers" element={<FlyerBuilder />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
