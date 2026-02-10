// src/AppShell.jsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import ProductsPage from "./pages/ProductsPage";
import ProductForm from "./components/ProductForm";
import FlyerBuilder from "./pages/FlyerBuilder";
import PromotionBuilder from "./components/PromotionBuilder";
import Login from "./pages/Login";
import Ranking from "./pages/Ranking";
import CncPage from "./pages/CncPage";
import MatinalPage from "./pages/MatinalPage";
import VespertinaPage from "./pages/VespertinaPage";
import PlanComercialPage from "./pages/PlanComercialPage";

import PrivateRoute from "./routes/PrivateRoute";
import { useAuth } from "./context/useAuth";

export default function AppShell() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Evita pantalla blanca mientras carga auth
  if (loading) {
    return <div style={{ padding: 20 }}>Cargando...</div>;
  }

  return (
    <>
      {/* Navbar solo si hay usuario y no estamos en login */}
      {user && location.pathname !== "/login" && <Navbar />}

      <Routes>
        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* RAÍZ */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* CNC (admin + promotor) */}
        <Route
          path="/cnc"
          element={
            <PrivateRoute roles={["admin", "promotor"]}>
              <CncPage />
            </PrivateRoute>
          }
        />

        {/* MATINAL (admin + promotor) */}
        <Route
          path="/matinal"
          element={
            <PrivateRoute roles={["admin", "promotor"]}>
              <MatinalPage />
            </PrivateRoute>
          }
        />

        {/* VESPERTINA (admin + promotor) */}
        <Route
          path="/vespertina"
          element={
            <PrivateRoute roles={["admin", "promotor"]}>
              <VespertinaPage />
            </PrivateRoute>
          }
        />

        {/* PLAN COMERCIAL (admin + promotor) */}
        <Route
          path="/plan-comercial"
          element={
            <PrivateRoute roles={["admin", "promotor"]}>
              <PlanComercialPage />
            </PrivateRoute>
          }
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute roles={["admin", "promotor"]}>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* RANKING */}
        <Route
          path="/ranking"
          element={
            <PrivateRoute roles={["admin", "promotor"]}>
              <Ranking />
            </PrivateRoute>
          }
        />

        {/* PRODUCTOS */}
        <Route
          path="/products"
          element={
            <PrivateRoute roles={["admin", "promotor"]}>
              <ProductsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/products/new"
          element={
            <PrivateRoute roles={["admin"]}>
              <ProductForm />
            </PrivateRoute>
          }
        />

        <Route
          path="/products/:id/edit"
          element={
            <PrivateRoute roles={["admin"]}>
              <ProductForm />
            </PrivateRoute>
          }
        />

        {/* PROMOCIONES */}
        <Route
          path="/promos"
          element={
            <PrivateRoute roles={["admin"]}>
              <PromotionBuilder />
            </PrivateRoute>
          }
        />

        {/* FLYERS */}
        <Route
          path="/flyers"
          element={
            <PrivateRoute roles={["admin", "promotor"]}>
              <FlyerBuilder />
            </PrivateRoute>
          }
        />

        {/* FALLBACK */}
        <Route
          path="*"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </>
  );
}
