// src/pages/ProductsPage.jsx
import React, { useState } from "react";
import ProductList from "../components/ProductList";
import PromotionBuilder from "../components/PromotionBuilder";

export default function ProductsPage() {
  const [selectedProducts, setSelectedProducts] = useState([]);

  const handleToggleTier = (product) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
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
        <ProductList onToggleTier={handleToggleTier} />
      </div>

      {/* RIGHT */}
      <div className="col-6 overflow-auto p-3">
        <PromotionBuilder selectedProducts={selectedProducts} />
      </div>
    </div>
  );
}
