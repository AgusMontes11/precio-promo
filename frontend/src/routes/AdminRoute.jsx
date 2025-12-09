// src/routes/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, role, loading } = useAuth();

  if (loading) return null;

  if (!user || role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
