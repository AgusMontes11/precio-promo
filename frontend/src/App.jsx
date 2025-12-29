// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import AppShell from "./AppShell";
import { useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";

// 👇 IMPORTAMOS EL BANNER PARA INSTALAR LA APP
import InstallBanner from "./components/InstallBanner";

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        {/* Tu aplicación principal */}
        <AppShell />

        {/* Banner para instalar la PWA (aparece solo cuando corresponde) */}
        <InstallBanner />
      </ThemeProvider>
    </BrowserRouter>
  );
}
