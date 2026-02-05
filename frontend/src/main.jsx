// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

// 🟣 PWA SERVICE WORKER
import { registerSW } from "virtual:pwa-register";

// Se registra el SW APENAS arranca la app
registerSW({
  onNeedRefresh() {
    console.log("Hay una nueva versión disponible.");
  },
  onOfflineReady() {
    console.log("La app está lista para funcionar offline 😎");
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </AuthProvider>
);

const bootSplash = document.getElementById("boot-splash");
if (bootSplash) {
  const minVisibleMs = 500;
  window.setTimeout(() => {
    bootSplash.classList.add("is-hidden");
    window.setTimeout(() => bootSplash.remove(), 300);
  }, minVisibleMs);
}
