// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // usuario completo
  const [role, setRole] = useState(null);   // "admin" o "promotor"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("usuario");

    if (token && rawUser) {
      try {
        const parsed = JSON.parse(rawUser);

        // Soporta:
        // - usuario.role
        // - usuario.user_metadata.role (por si viene de Supabase)
        const detectedRole =
          parsed.role ||
          parsed.user_metadata?.role ||
          null;

        setUser(parsed);
        setRole(detectedRole);
      } catch (err) {
        console.error("Error parseando usuario:", err);
      }
    }

    setLoading(false);
  }, []);

  const login = (token, usuario) => {
    const detectedRole =
      usuario.role ||
      usuario.user_metadata?.role ||
      null;

    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuario));

    setUser(usuario);
    setRole(detectedRole);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
