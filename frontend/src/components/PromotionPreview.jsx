// src/components/PromotionPreview.jsx
import React, { useState } from "react";
import "./PromotionPreview.css";

export default function PromotionPreview({ products }) {
  const [toast, setToast] = useState(null);

  const generateMessage = () => {
    if (!products || products.length === 0) return "No hay productos seleccionados.";

    const lines = ["🔥 *PROMOS DEL DÍA* 🔥\n"];

    products.forEach((p) => {
      if (!p.discountTiers || p.discountTiers.length === 0) return;
      lines.push(`\n*${p.name}*`);

      p.discountTiers.forEach((tier) => {
        const finalPrice = (p.price * (1 - tier.discount / 100)).toFixed(0);
        lines.push(`• ${tier.quantity} bulto(s): *$${finalPrice}* (${tier.discount}% OFF)`);
      });
    });

    lines.push(`\n🗓️ Actualizado: ${new Date().toLocaleDateString()}`);
    return lines.join("\n");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMessage())
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
      <h4>Vista previa</h4>

      <pre
        style={{
          background: "#f8f8f8",
          padding: 15,
          borderRadius: 8,
          whiteSpace: "pre-wrap",
        }}
      >
        {generateMessage()}
      </pre>

      <button className="btn btn-success" onClick={handleCopy}>
        Copiar mensaje
      </button>

      {toast && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: toast === "success" ? "#4caf50" : "#f44336",
            color: "#fff",
            padding: "20px 30px",
            borderRadius: 8,
            zIndex: 9999,
            fontSize: "1.3rem",
            fontWeight: "bold",
          }}
        >
          {toast === "success" ? "¡Copiado!" : "Error copiando"}
        </div>
      )}
    </div>
  );
}
