// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import ProductsPage from "./pages/ProductsPage";
import ProductForm from "./components/ProductForm";
import FlyerBuilder from "./pages/FlyerBuilder";
import PromotionBuilder from "./components/PromotionBuilder";
import Login from "./pages/Login";
import { useLocation } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoute";
import { useAuth } from "./context/AuthContext";

import "./styles.css";

export default function App() {
  const { user, loading } = useAuth();
  const location = useLocation();


  if (loading) return null; // Evita parpadeos al recargar

  return (
    <BrowserRouter>
      {/* ✅ Navbar solo si hay usuario logueado */}
      {user && <Navbar />}

      <Routes>
        {/* ✅ Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* ✅ Redirección inicial */}
        <Route
          path="/"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          }
        />

        {/* ✅ Dashboard (admin + supervisor) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute roles={["admin", "supervisor"]}>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* ✅ Productos (admin + supervisor) */}
        <Route
          path="/products"
          element={
            <PrivateRoute roles={["admin", "supervisor"]}>
              <ProductsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/products/new"
          element={
            <PrivateRoute roles={["admin", "supervisor"]}>
              <ProductForm />
            </PrivateRoute>
          }
        />

        <Route
          path="/products/:id/edit"
          element={
            <PrivateRoute roles={["admin", "supervisor"]}>
              <ProductForm />
            </PrivateRoute>
          }
        />

        {/* ✅ Promociones (solo admin) */}
        <Route
          path="/promos"
          element={
            <PrivateRoute roles={["admin"]}>
              <PromotionBuilder />
            </PrivateRoute>
          }
        />

        {/* ✅ Flyers (admin + supervisor + promotor) */}
        <Route
          path="/flyers"
          element={
            <PrivateRoute roles={["admin", "supervisor", "promotor"]}>
              <FlyerBuilder />
            </PrivateRoute>
          }
        />

        {/* ✅ Fallback */}
        <Route
          path="*"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
