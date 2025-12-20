import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null); // 🔥 ESTE FALTABA
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const rawUser = localStorage.getItem("usuario");

    if (storedToken && rawUser) {
      try {
        const parsed = JSON.parse(rawUser);

        const detectedRole =
          parsed.role ||
          parsed.user_metadata?.role ||
          null;

        setUser(parsed);
        setRole(detectedRole);
        setToken(storedToken); // 🔥 ACÁ TAMBIÉN
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
        token,     // 🔥 AHORA SÍ EXISTE
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
