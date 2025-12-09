// src/routes/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children, roles }) {
  const { user, role, loading } = useAuth();

  if (loading) return null;

  // No logueado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay roles requeridos y el rol actual no está permitido
  if (roles && !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
