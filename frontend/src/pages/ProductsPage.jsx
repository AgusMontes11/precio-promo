// src/pages/ProductsPage.jsx
import React, { useState } from "react";
import ProductList from "../components/ProductList";
import PromotionBuilder from "../components/PromotionBuilder";

export default function ProductsPage() {
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Estado persistente de escalonadas editadas
  const [editedTiers, setEditedTiers] = useState({});

  // Seleccionar / des-seleccionar productos
  const handleToggleTier = (product) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);

      if (exists) {
        // ❗ Importante: al desmarcar NO borramos los tiers del producto
        return prev.filter((p) => p.id !== product.id);
      }

      return [...prev, product];
    });
  };

  // Guardar cambios de tiers hechos en ProductForm
  const handleSaveTiers = (productId, tierData) => {
    setEditedTiers((prev) => ({
      ...prev,
      [productId]: tierData, // { hasTiers: true/false, discountTiers: [...] }
    }));
  };

  return (
    <div
      className="row m-0"
      style={{ height: "100vh", background: "var(--bg-main)" }}
    >
      {/* LEFT */}
      <div
        className="col-6 border-end overflow-auto"
        style={{ borderColor: "var(--border-color)" }}
      >
        <ProductList 
          onToggleTier={handleToggleTier}
          editedTiers={editedTiers} 
        />
      </div>

      {/* RIGHT */}
      <div className="col-6 overflow-auto p-3">
        <PromotionBuilder 
          selectedProducts={selectedProducts}
          editedTiers={editedTiers}
          onSaveTiers={handleSaveTiers}
        />
      </div>
    </div>
  );
}
