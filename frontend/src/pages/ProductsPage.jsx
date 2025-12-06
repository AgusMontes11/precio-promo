// src/pages/ProductsPage.jsx
import React, { useState } from "react";
import ProductList from "../components/ProductList";
import PromotionBuilder from "../components/PromotionBuilder";
import api from "../services/api";

export default function ProductsPage() {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editedTiers, setEditedTiers] = useState({});

  // seleccionar o deseleccionar producto
  const handleToggleTier = (product) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  // guardar escalonadas AUTOMÁTICAMENTE
  const handleSaveTiers = async (productId, data) => {
    setEditedTiers((prev) => ({
      ...prev,
      [productId]: data,
    }));

    try {
      await api.put(`/products/${productId}`, {
        hasTiers: true,
        discountTiers: data.discountTiers,
      });

      console.log("Guardado OK en backend:", data);
    } catch (e) {
      console.error("ERROR guardando escalonadas", e);
    }
  };

  return (
    <div
      className="row m-0"
      style={{ height: "100vh", background: "var(--bg-main)" }}
    >
      <div
        className="col-6 border-end overflow-auto"
        style={{ borderColor: "var(--border-color)" }}
      >
        <ProductList onToggleTier={handleToggleTier} />
      </div>

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
