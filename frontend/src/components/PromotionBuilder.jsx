// src/components/PromotionBuilder.jsx
import React from "react";
import PromotionPreview from "./PromotionPreview";
import "./PromotionBuilder.css";

export default function PromotionBuilder({
  selectedProducts,
  editedTiers,
  onSaveTiers,
}) {
  // Obtener tiers efectivos de un producto
  const getTierData = (p) => {
    return (
      editedTiers[p.id] ?? {
        hasTiers: p.has_tiers,
        discountTiers: p.discount_tiers ?? [],
      }
    );
  };

  // Modificar una escalonada
  const updateTier = (productId, index, field, value) => {
    const current = editedTiers[productId] ?? {
      hasTiers: true,
      discountTiers: [],
    };

    const newTiers = [...current.discountTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };

    onSaveTiers(productId, {
      hasTiers: true,
      discountTiers: newTiers,
    });
  };

  // Agregar escalonada
  const addTier = (productId) => {
    const current = editedTiers[productId] ?? {
      hasTiers: true,
      discountTiers: [],
    };

    onSaveTiers(productId, {
      hasTiers: true,
      discountTiers: [
        ...current.discountTiers,
        { quantity: 1, discount: 0 },
      ],
    });
  };

  // Eliminar escalonada
  const removeTier = (productId, index) => {
    const current = editedTiers[productId];
    if (!current) return;

    const filtered = current.discountTiers.filter((_, i) => i !== index);

    onSaveTiers(productId, {
      hasTiers: true,
      discountTiers: filtered,
    });
  };

  return (
    <div className="shopify-container position-relative">
      
      {/* TITULO */}
      <h5 className="builder-title">Configurar Escalonadas</h5>

      {/* SI NO HAY SELECCIONADOS */}
      {selectedProducts.length === 0 ? (
        <p className="builder-empty">Seleccioná productos para agregar escalonadas</p>
      ) : (
        <div
          className={`${selectedProducts.length >= 3 ? "overflow-auto" : ""}`}
          style={{ maxHeight: selectedProducts.length >= 3 ? "360px" : "none" }}
        >
          <div className="row g-3">
            {selectedProducts.map((p) => {
              const tierData = getTierData(p);

              return (
                <div key={p.id} className="col-12 col-md-6">
                  <div className="shopify-card h-100 d-flex flex-column">

                    <div className="builder-product-name mb-2">
                      {p.name}
                    </div>

                    {/* TABLA */}
                    <div
                      className={`flex-grow-1 ${tierData.discountTiers.length > 3 ? "overflow-auto" : ""}`}
                      style={{
                        maxHeight: tierData.discountTiers.length > 3 ? "150px" : "auto",
                        paddingRight: "3px",
                      }}
                    >
                      <table className="table table-sm mb-2 builder-table">
                        <thead className="sticky-header">
                          <tr>
                            <th className="builder-th">Cantidad</th>
                            <th className="builder-th">Descuento %</th>
                            <th></th>
                          </tr>
                        </thead>

                        <tbody>
                          {tierData.discountTiers.map((tier, index) => (
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
              );
            })}
          </div>
        </div>
      )}

      {/* PREVIEW */}
      <PromotionPreview
        products={selectedProducts.map((p) => {
          const t = getTierData(p);
          return { ...p, ...t };
        })}
      />
    </div>
  );
}
