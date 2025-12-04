// src/components/PromotionBuilder.jsx
import React, { useState, useEffect } from "react";
import PromotionPreview from "./PromotionPreview";
import "./PromotionBuilder.css";

export default function PromotionBuilder({ selectedProducts }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const normalized = selectedProducts.map((p) => ({
      ...p,
      discountTiers: Array.isArray(p.discountTiers)
        ? p.discountTiers
        : [{ quantity: 1, discount: 0 }],
    }));

    setProducts(normalized);
  }, [selectedProducts]);

  const updateTier = (productId, index, field, value) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;

        const tiers = [...p.discountTiers];
        tiers[index] = { ...tiers[index], [field]: value };

        return { ...p, discountTiers: tiers };
      })
    );
  };

  const addTier = (productId) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              discountTiers: [...p.discountTiers, { quantity: 1, discount: 0 }],
            }
          : p
      )
    );
  };

  const removeTier = (productId, index) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              discountTiers: p.discountTiers.filter((_, i) => i !== index),
            }
          : p
      )
    );
  };

  return (
    <div className="shopify-container position-relative">

      {/* TÍTULO PRINCIPAL */}
      <h5 className="builder-title">Configurar Escalonadas</h5>

      {/* SI NO HAY PRODUCTOS */}
      {products.length === 0 ? (
        <p className="builder-empty">Seleccioná productos para agregar escalonadas</p>
      ) : (
        <div
          className={`${products.length >= 3 ? "overflow-auto" : ""}`}
          style={{
            maxHeight: products.length >= 3 ? "360px" : "none",
            paddingRight: "4px",
          }}
        >
          <div className="row g-3">
            {products.map((p) => (
              <div key={p.id} className="col-12 col-md-6">

                {/* TARJETA */}
                <div className="shopify-card h-100 d-flex flex-column">

                  {/* HEADER */}
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="builder-product-name">{p.name}</div>
                  </div>

                  {/* TABLA DE ESCALONADAS */}
                  <div
                    className={`flex-grow-1 ${
                      p.discountTiers.length > 3 ? "overflow-auto" : ""
                    }`}
                    style={{
                      maxHeight: p.discountTiers.length > 3 ? "150px" : "auto",
                      paddingRight: "3px",
                    }}
                  >
                    <table className="table table-sm mb-2 builder-table">
                      <thead className="sticky-header">
                        <tr>
                          <th className="builder-th">Cantidad</th>
                          <th className="builder-th">Descuento %</th>
                          <th className="builder-th"></th>
                        </tr>
                      </thead>

                      <tbody>
                        {p.discountTiers.map((tier, index) => (
                          <tr key={index}>
                            <td>
                              <input
                                type="number"
                                min="1"
                                className="form-control form-control-sm builder-input"
                                value={tier.quantity}
                                onChange={(e) =>
                                  updateTier(
                                    p.id,
                                    index,
                                    "quantity",
                                    Number(e.target.value)
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                type="number"
                                min="0"
                                className="form-control form-control-sm builder-input"
                                value={tier.discount}
                                onChange={(e) =>
                                  updateTier(
                                    p.id,
                                    index,
                                    "discount",
                                    Number(e.target.value)
                                  )
                                }
                              />
                            </td>

                            <td className="text-end">
                              <button
                                className="builder-remove-btn"
                                onClick={() => removeTier(p.id, index)}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* BOTÓN AGREGAR */}
                  <button
                    className="builder-add-btn mt-auto"
                    onClick={() => addTier(p.id)}
                  >
                    ＋ Agregar Escalonada
                  </button>

                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <PromotionPreview products={products} />

      {/* BOTÓN FLOTANTE */}
      <button
        className="floating-add-btn"
        onClick={() => console.log("Agregar producto…")}
      >
        +
      </button>
    </div>
  );
}
