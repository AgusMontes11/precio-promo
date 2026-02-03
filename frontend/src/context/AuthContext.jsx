import { useState } from "react";
import { AuthContext } from "./AuthContextBase";

export function AuthProvider({ children }) {
  const readStoredAuth = () => {
    const storedToken = localStorage.getItem("token");
    const rawUser = localStorage.getItem("usuario");

    if (!storedToken || !rawUser) {
      return { user: null, role: null, token: null };
    }

    try {
      const parsed = JSON.parse(rawUser);
      const detectedRole = parsed.role || parsed.user_metadata?.role || null;
      return { user: parsed, role: detectedRole, token: storedToken };
    } catch (error) {
      console.error("Error parseando usuario:", error);
      return { user: null, role: null, token: null };
    }
  };

  const initialAuth = readStoredAuth();
  const [user, setUser] = useState(initialAuth.user);
  const [role, setRole] = useState(initialAuth.role);
  const [token, setToken] = useState(initialAuth.token);
  const [loading] = useState(false);

  const login = (token, usuario) => {
    const detectedRole =
      usuario.role ||
      usuario.user_metadata?.role ||
      null;

    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuario));

    setUser(usuario);
    setRole(detectedRole);
    setToken(token); // 🔥 FUNDAMENTAL
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUser(null);
    setRole(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token, // 🔥 AHORA SÍ EXISTE
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
