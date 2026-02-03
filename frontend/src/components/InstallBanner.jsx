import React from "react";
import useInstallPrompt from "../hooks/useInstallPrompt";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallBanner() {
  const { prompt, install, clearPrompt } = useInstallPrompt();
  const MotionDiv = motion.div;

  // Si no hay prompt, no mostramos nada
  if (!prompt) return null;

  return (
    <AnimatePresence>
      <MotionDiv
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          position: "fixed",
          bottom: 15,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#0d1b2a",
          color: "#fff",
          padding: "16px 22px",
          borderRadius: 14,
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          zIndex: 99999,
          maxWidth: "90%",
          width: "350px",
          textAlign: "center",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          Instalar Panella Manager
        </div>

        <div className="d-flex justify-content-center gap-2">
          <button
            className="btn btn-light btn-sm"
            onClick={install}
          >
            Instalar
          </button>

          <button
            className="btn btn-outline-light btn-sm"
            onClick={clearPrompt}
          >
            No ahora
          </button>
        </div>
      </MotionDiv>
    </AnimatePresence>
  );
}
