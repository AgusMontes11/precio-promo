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

import PrivateRoute from "./routes/PrivateRoute";
import { useAuth } from "./context/AuthContext";

export default function AppShell() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  return (
    <>
      {/* Navbar solo si hay usuario y no estamos en login */}
      {user && location.pathname !== "/login" && <Navbar />}

      <Routes>
        <Route path="/login" element={<Login />} />

        {/* raíz: si hay user → dashboard, sino → login */}
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

        {/* SOLO ADMIN */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute roles={["admin", "promotor"]}>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/ranking"
          element={
            <PrivateRoute roles={["admin", "promotor"]}>
              <Ranking />
            </PrivateRoute>
          }
        />

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

        <Route
          path="/promos"
          element={
            <PrivateRoute roles={["admin"]}>
              <PromotionBuilder />
            </PrivateRoute>
          }
        />

        {/* ADMIN + PROMOTOR */}
        <Route
          path="/flyers"
          element={
            <PrivateRoute roles={["admin", "promotor"]}>
              <FlyerBuilder />
            </PrivateRoute>
          }
        />

        {/* fallback */}
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
