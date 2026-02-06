// src/components/ProductList.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";
import ProductForm from "./ProductForm";
import "./css/productlist.css";
import { useAuth } from "../context/useAuth";

export default function ProductList({ selectedProducts = [], onToggleSelection }) {
  const { user } = useAuth();
  const isPromotor = user?.role === "promotor";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [expandedNameId, setExpandedNameId] = useState(null);
  const tableRef = useRef(null);

  // FILTROS
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

  // PAGINACIÓN
  const [itemsPerPage] = useState(5);
  const [page, setPage] = useState(1);

  // EN MOVIL QUE SEAN SELECTS
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);

  // =====================================
  // CARGA DE PRODUCTOS
  // =====================================

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 576);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/products");

      const prods = res.data.map((p) => {
        const discountTiers = p.discount_tiers ?? p.discountTiers ?? [];

        const hasTiersFlag =
          p.has_tiers ??
          p.hasTiers ??
          (Array.isArray(discountTiers) && discountTiers.length > 0);

        return {
          ...p,
          id: p.id ?? p._id,
          imageUrl: p.imageUrl || p.imageurl || p.imageURL || p.image || null, // <--- UNIFICADO
          hasTiers: hasTiersFlag,
          discountTiers,
        };
      });

      setProducts(prods);
    } catch (err) {
      console.error(err);
      setAlert({ type: "danger", text: "Error cargando productos." });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!expandedNameId) return;
      const target = event.target;
      if (target.closest?.(".shopify-name-cell")) return;
      setExpandedNameId(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [expandedNameId]);

  const isSelected = (productId) =>
    selectedProducts.some((p) => p.id === productId);

  // =====================================
  // DELETE
  // =====================================
  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeleteProduct(null);
      setAlert({ type: "success", text: "Producto eliminado" });
    } catch (error) {
      console.error("Error eliminando producto", error);
      setAlert({ type: "danger", text: "Error eliminando producto" });
    }
  };

  // =====================================
  // CATEGORÍAS
  // =====================================
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [products]);

  const toggleCategoryChip = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // =====================================
  // FILTROS
  // =====================================
  const filtered = useMemo(() => {
    let data = [...products];

    if (search.trim() !== "") {
      data = data.filter((p) =>
        p.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedCategories.length > 0) {
      data = data.filter((p) => selectedCategories.includes(p.category));
    }

    return data;
  }, [products, search, selectedCategories]);

  // =====================================
  // PAGINACIÓN
  // =====================================
  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, itemsPerPage, page]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const selectionCount = selectedProducts.length;
  const emptyColSpan = (isMobile ? 5 : 6) + (isPromotor ? 0 : 1);

  // =====================================
  // HELPERS
  // =====================================
  const imgSrc = (url, id) => {
    if (!url) return "/placeholder.png";
    return `${url}?v=${id}`;
  };

  // =====================================
  // UI
  // =====================================
  return (
    <div className="shopify-page px-3 py-3">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="shopify-title mb-0">Productos de Panella</h2>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="shopify-selection-count">
            En lista: {selectionCount}
          </span>
          {!isPromotor && (
            <button
              className="btn btn-outline-primary btn-sm shopify-add-btn mb-1"
              onClick={() => setEditingProduct({ id: null })}
            >
              + Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <div className="shopify-card p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-center w-100">
          <input
            type="text"
            placeholder="Buscar productos..."
            className="shopify-input"
            style={{ width: "100%" }}
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
      </div>

      {/* CATEGORY FILTER – MOBILE SELECT / DESKTOP CHIPS */}
      {isMobile ? (
        <select
          className="shopify-select mt-1 mb-3"
          value={selectedCategories[0] || ""}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedCategories(value ? [value] : []);
          }}
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      ) : (
        <div className="d-flex flex-wrap gap-2 mt-3 p-2 pb-3">
          {categories.map((cat) => (
            <span
              key={cat}
              className={`shopify-tag ${
                selectedCategories.includes(cat) ? "active" : ""
              }`}
              onClick={() => toggleCategoryChip(cat)}
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* ALERT */}
      {alert && (
        <div className={`alert alert-${alert.type} shopify-alert`}>
          {alert.text}
        </div>
      )}

        {/* PRODUCT LIST */}
        {!loading && (
          <div className="shopify-card p-0 shopify-table-container" ref={tableRef}>
            <div className="shopify-table-wrapper">
              <table className="table align-middle shopify-table">
                <thead className="shopify-thead">
                  <tr>
                  <th>Esc.</th>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  {!isMobile && <th>Categoría</th>}
                  <th style={{ width: 60, textAlign: "center" }}>+</th>
                  {!isPromotor && <th style={{ width: 160 }}>Acciones</th>}
                </tr>
              </thead>

              <tbody>
                {paginated.map((p) => (
                  <tr key={p.id}>
                    <td>{p.hasTiers ? "Si" : "No"}</td>

                    <td>
                      <img
                        src={imgSrc(p.imageUrl, p.id)}
                        alt={p.name}
                        className="shopify-thumb"
                        onError={(e) => (e.target.src = "/placeholder.png")}
                      />
                    </td>

                    <td
                      className={`fw-semibold shopify-name-cell${
                        expandedNameId === p.id ? " is-expanded" : ""
                      }`}
                      data-full={p.name}
                      title="Tocar para ver completo"
                      onClick={() =>
                        setExpandedNameId((prev) => (prev === p.id ? null : p.id))
                      }
                    >
                      <span className="shopify-name-text">{p.name}</span>
                    </td>

                    <td>${Number(p.price).toLocaleString("es-AR")}</td>

                    {!isMobile && <td>{p.category || "-"}</td>}

                    <td className="text-center">
                      <button
                        className={`btn-sm shopify-plus-btn${
                          isSelected(p.id) ? " is-active" : ""
                        }`}
                        aria-label={
                          isSelected(p.id)
                            ? "Quitar de la lista"
                            : "Agregar a la lista"
                        }
                        onClick={() => onToggleSelection?.(p)}
                      >
                        +
                      </button>
                    </td>

                    <td>
                      {!isPromotor && (
                        <button
                          className="btn-sm shopify-outline-btn me-2"
                          onClick={() => setEditingProduct(p)}
                        >
                          Editar
                        </button>
                      )}
                      {!isPromotor && (
                        <button
                          className="btn-sm shopify-danger-btn"
                          onClick={() => setDeleteProduct(p)}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={emptyColSpan} className="text-center p-4 text-muted">
                      No se encontraron productos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAGINACIÓN */}
      <div className="pagination-wrapper">
        {!loading && totalPages > 1 && (
          <div className="shopify-pagination d-flex align-items-center gap-3 p-3 justify-content-center">
            <button
              className="shopify-paginacion-btn align-items-center"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Anterior
            </button>

            <span className="shopify-page-indicator align-items-center">
              Página {page} de {totalPages}
            </span>

            <button
              className="shopify-paginacion-btn"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingProduct && (
        <div className="shopify-modal-backdrop">
          <div className="shopify-modal">
            <div className="d-flex justify-content-between mb-2">
              <h5>
                {editingProduct.id ? "Editar Producto" : "Nuevo Producto"}
              </h5>

              <button
                className="shopify-close-btn"
                onClick={() => setEditingProduct(null)}
              >
                ✕
              </button>
            </div>

            <ProductForm
              productId={editingProduct.id}
              onClose={() => {
                setEditingProduct(null);
                loadProducts();
              }}
            />
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteProduct && (
        <div className="shopify-modal-backdrop">
          <div className="shopify-modal small">
            <h5>Eliminar Producto</h5>
            <p>
              ¿Seguro querés eliminar <strong>{deleteProduct.name}</strong>?
            </p>

            <div className="d-flex justify-content-end gap-2">
              <button
                className="shopify-secondary-btn"
                onClick={() => setDeleteProduct(null)}
              >
                Cancelar
              </button>

              <button
                className="shopify-danger-btn"
                onClick={() => handleDelete(deleteProduct.id)}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
