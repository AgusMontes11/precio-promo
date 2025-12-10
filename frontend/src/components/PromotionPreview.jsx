// src/components/PromotionPreview.jsx
import React, { useState } from "react";
import "./css/PromotionPreview.css";

export default function PromotionPreview({ products }) {
  const [toast, setToast] = useState(null);

  const generateMessage = () => {
    if (!products || products.length === 0)
      return "No hay productos seleccionados.";

    const lines = ["🔥 *PROMOS DEL DÍA* 🔥\n"];

    products.forEach((p) => {
      if (!p.discountTiers || p.discountTiers.length === 0) return;
      lines.push(`\n*${p.name}*`);

      p.discountTiers.forEach((tier) => {
        const finalPrice = (p.price * (1 - tier.discount / 100)).toFixed(0);
        lines.push(
          `• ${tier.quantity} bulto(s): *$${finalPrice}* (${tier.discount}% OFF)`
        );
      });
    });

    lines.push(`\n🗓️ Actualizado: ${new Date().toLocaleDateString()}`);
    return lines.join("\n");
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(generateMessage())
      .then(() => {
        setToast("success");
        setTimeout(() => setToast(null), 1000);
      })
      .catch(() => {
        setToast("error");
        setTimeout(() => setToast(null), 1000);
      });
  };

  return (
    <div className="mt-4 preview-box">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h4 className="mb-0 preview-title">Vista previa</h4>
        <small className="preview-subtitle">
          Texto para lista de difusión
        </small>
      </div>

      <pre className="preview-content">{generateMessage()}</pre>

      <button className="btn btn-success mt-3" onClick={handleCopy}>
        Copiar mensaje
      </button>

      {toast && (
        <div className={`preview-toast ${toast === "success" ? "ok" : "error"}`}>
          {toast === "success" ? "¡Copiado!" : "Error copiando"}
        </div>
      )}
    </div>
  );
}
