// src/components/ProductList.jsx
import React, { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import ProductForm from "./ProductForm";
import "./productlist.css";

export default function ProductList({ onToggleTier }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // modales
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);

  // FILTROS
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortMode, setSortMode] = useState("none");

  // PAGINACIÓN
  const ITEMS_PER_PAGE = 7;
  const [page, setPage] = useState(1);

  // ------------------------------
  // CARGA DE PRODUCTOS
  // ------------------------------
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products");

      const prods = res.data.map((p) => {
        const discountTiers =
          p.discountTiers ?? p.discount_tiers ?? [];

        const hasTiersFlag =
          p.hasTiers ??
          p.has_tiers ??
          (Array.isArray(discountTiers) && discountTiers.length > 0);

        return {
          ...p,
          id: p.id ?? p._id,
          imageUrl: p.imageurl ?? null,
          hasTiers: hasTiersFlag,
          discountTiers,
        };
      });

      setProducts(prods);

      console.log("PRODUCTOS CRUDOS:", prods);
      console.log(
        "IMAGENES:",
        prods.map((p) => p.imageUrl)
      );
    } catch (err) {
      console.error(err);
      setAlert({ type: "danger", text: "Error cargando productos." });
    }
    setLoading(false);
  };

  // ------------------------------
  // TOGGLE ESCALONADAS (checkbox)
  // ------------------------------
  const toggleTier = async (p) => {
    const updated = { ...p, hasTiers: !p.hasTiers };

    // actualizar en el estado local
    setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));

    // avisar al padre (ProductsPage) para agregar/quitar en selectedProducts
    onToggleTier?.(updated);

    // persistir sólo el flag y las escalonadas
    try {
      await api.put(`/products/${p.id}`, {
        name: updated.name,
        price: updated.price,
        category: updated.category,
        imageurl: updated.imageurl ?? updated.imageUrl ?? null,
        hasTiers: updated.hasTiers,
        discountTiers: updated.discountTiers || [],
      });
    } catch (err) {
      console.warn("No se pudo persistir hasTiers", err);
    }
  };

  // ------------------------------
  // DELETE
  // ------------------------------
  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeleteProduct(null);
      setAlert({ type: "success", text: "Producto eliminado" });
    } catch (err) {
      setAlert({ type: "danger", text: "Error eliminando producto" });
    }
  };

  // ------------------------------
  // CATEGORÍAS AUTO
  // ------------------------------
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

  // ------------------------------
  // FILTRADO + ORDENADO
  // ------------------------------
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

    switch (sortMode) {
      case "priceAsc":
        data.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "priceDesc":
        data.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "az":
        data.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "za":
        data.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    return data;
  }, [products, search, selectedCategories, sortMode]);

  // ------------------------------
  // PAGINACIÓN
  // ------------------------------
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  // ------------------------------
  // HELPERS
  // ------------------------------
  const imgSrc = (url) =>
    url
      ? url.startsWith("http")
        ? url
        : `https://precio-promo-backend.onrender.com${url}`
      : "/placeholder.png";

  // ------------------------------
  // UI
  // ------------------------------
  return (
    <div className="shopify-page px-3 py-3">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="shopify-title mb-0">Productos de Panella</h2>

        <button
          className="btn btn-outline-primary btn-sm shopify-add-btn mb-1"
          onClick={() => setEditingProduct({ id: null })}
        >
          + Nuevo Producto
        </button>
      </div>

      {/* FILTER CARD */}
      <div className="shopify-card p-3 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          {/* BUSCADOR */}
          <input
            type="text"
            placeholder="Buscar productos..."
            className="shopify-input"
            style={{ maxWidth: 280 }}
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />

          {/* SELECT ORDEN */}
          <select
            className="shopify-select"
            style={{ maxWidth: 200 }}
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
          >
            <option value="none">Ordenar...</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
            <option value="priceAsc">Más baratos</option>
            <option value="priceDesc">Más caros</option>
          </select>
        </div>

        {/* CATEGORY TAGS */}
        <div className="d-flex flex-wrap gap-2 mt-3">
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
      </div>

      {/* ALERTS */}
      {alert && (
        <div className={`alert alert-${alert.type} shopify-alert`}>
          {alert.text}
        </div>
      )}

      {/* SKELETON LOADER */}
      {loading && (
        <div className="p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shopify-skeleton-row mb-3"></div>
          ))}
        </div>
      )}

      {/* PRODUCT TABLE */}
      {!loading && (
        <div className="shopify-card p-0 shopify-table-container">
          <div className="shopify-table-wrapper">
            <table className="table table-hover align-middle shopify-table">
              <thead className="shopify-thead">
                <tr>
                  <th>Esc.</th>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Categoría</th>
                  <th style={{ width: 160 }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {paginated.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={p.hasTiers}
                        onChange={() => toggleTier(p)}
                        className="shopify-checkbox"
                      />
                    </td>

                    <td>
                      <img
                        src={imgSrc(p.imageUrl)}
                        alt={p.name}
                        className="shopify-thumb"
                        onError={(e) => (e.target.src = "/placeholder.png")}
                      />
                    </td>

                    <td className="fw-semibold">{p.name}</td>

                    <td>${Number(p.price).toLocaleString("es-AR")}</td>

                    <td>{p.category || "-"}</td>

                    <td>
                      <button
                        className="btn-sm shopify-outline-btn me-2"
                        onClick={() => setEditingProduct(p)}
                      >
                        Editar
                      </button>

                      <button
                        className="btn-sm shopify-danger-btn"
                        onClick={() => setDeleteProduct(p)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}

                {paginated.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center p-4 text-muted">
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
      {!loading && totalPages > 1 && (
        <div className="d-flex justify-content-center mt-3 gap-2 flex-wrap">
          <button
            className="shopify-paginacion-btn"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Anterior
          </button>

          <span className="px-3 py-2 shopify-page-indicator">
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
