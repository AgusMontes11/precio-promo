// src/pages/ProductsPage.jsx
import React, { useState } from "react";
import ProductList from "../components/ProductList";
import PromotionBuilder from "../components/PromotionBuilder";

export default function ProductsPage() {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editedTiers, setEditedTiers] = useState({});

  // Cuando tildás / destildás el checkbox "Esc."
  const handleToggleTier = (product) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);

      // 👉 Si ya estaba seleccionado: lo saco y borro sus tiers editados
      if (exists) {
        const remaining = prev.filter((p) => p.id !== product.id);

        setEditedTiers((prevTiers) => {
          const copy = { ...prevTiers };
          delete copy[product.id];
          return copy;
        });

        return remaining;
      }

      // 👉 Si NO estaba seleccionado: lo agrego y preparo sus tiers iniciales
      setEditedTiers((prevTiers) => {
        if (prevTiers[product.id]) return prevTiers; // ya tenía algo local

        const serverHasTiers =
          product.hasTiers || product.has_tiers || false;

        const serverDiscounts =
          product.discountTiers || product.discount_tiers || [];

        return {
          ...prevTiers,
          [product.id]: {
            hasTiers: serverHasTiers || serverDiscounts.length > 0,
            discountTiers:
              serverDiscounts.length > 0
                ? serverDiscounts
                : [{ quantity: 1, discount: 0 }],
          },
        };
      });

      return [...prev, product];
    });
  };

  // Cuando editás una escalonada en el panel derecho
  const handleSaveTiers = (productId, tierData) => {
    setEditedTiers((prev) => ({
      ...prev,
      [productId]: tierData,
    }));
  };

  return (
    <div
      className="container-fluid px-0"
      style={{ minHeight: "100vh", background: "var(--bg-main)" }}
    >
      <div className="row g-0">
        {/* LISTA DE PRODUCTOS */}
        <div
          className="col-12 col-lg-6 border-end"
          style={{
            borderColor: "var(--border-color)",
            maxHeight: "100vh",
            overflow: "auto",
          }}
        >
          <ProductList onToggleTier={handleToggleTier} />
        </div>

        {/* PANEL DE ESCALONADAS / PREVIEW */}
        <div
          className="col-12 col-lg-6"
          style={{ maxHeight: "100vh", overflow: "auto" }}
        >
          <div className="p-3">
            <PromotionBuilder
              selectedProducts={selectedProducts}
              editedTiers={editedTiers}
              onSaveTiers={handleSaveTiers}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
