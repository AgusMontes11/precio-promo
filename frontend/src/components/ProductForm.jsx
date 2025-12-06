// src/components/ProductForm.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";
import "./ProductForm.css";

export default function ProductForm({ productId, onClose }) {
  const isEditing = Boolean(productId);

  const [product, setProduct] = useState({
    name: "",
    price: "",
    category: "",
    imageurl: null,
    hasTiers: false,
    discountTiers: [],
  });

  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const showAlert = (type, text, timeout = 4000) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), timeout);
  };

  const normalizeImage = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `https://precio-promo-backend.onrender.com${url}`;
  };

  // ========================================================
  // LOAD PRODUCT WHEN EDITING
  // ========================================================
  useEffect(() => {
    if (!isEditing) return;

    api.get(`/products/${productId}`).then((res) => {
      const data = res.data;

      setProduct({
        name: data.name || "",
        price: Number(data.price) || "",
        category: data.category || "",
        imageurl: data.imageurl || null,
        hasTiers: data.has_tiers || false,
        discountTiers: Array.isArray(data.discount_tiers)
          ? data.discount_tiers.sort((a, b) => a.quantity - b.quantity)
          : [],
      });
    });
  }, [productId, isEditing]);

  // ========================================================
  // TIERS VALIDATION
  // ========================================================
  const validateTiers = () => {
    const errors = [];

    const quantities = new Set();

    for (const t of product.discountTiers) {
      if (t.quantity < 1) errors.push("Cantidad mínima debe ser 1 o más.");
      if (t.discount < 0 || t.discount > 100)
        errors.push("El descuento debe estar entre 0% y 100%.");
      if (quantities.has(t.quantity))
        errors.push(`Cantidad duplicada: ${t.quantity} unidades.`);
      quantities.add(t.quantity);
    }

    return errors;
  };

  // ========================================================
  // SAVE PRODUCT
  // ========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product.name || !product.price) {
      showAlert("danger", "Complete nombre y precio");
      return;
    }

    if (product.hasTiers) {
      const tierErrors = validateTiers();
      if (tierErrors.length > 0) {
        showAlert("danger", tierErrors.join(" | "));
        return;
      }
    }

    setSaving(true);

    try {
      let imageUrl = product.imageurl;

      if (imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);

        const uploadRes = await api.post("/upload", fd);
        imageUrl = uploadRes.data.file;
      }

      const payload = {
        name: product.name,
        price: product.price,
        category: product.category,
        imageurl: imageUrl,
        hasTiers: product.hasTiers,
        discountTiers: product.discountTiers.sort(
          (a, b) => a.quantity - b.quantity
        ),
      };

      if (isEditing) {
        await api.put(`/products/${productId}`, payload);
      } else {
        await api.post("/products", payload);
      }

      showAlert("success", isEditing ? "Producto actualizado" : "Creado");

      setTimeout(() => onClose?.(), 900);
    } catch (err) {
      console.error(err);
      showAlert("danger", "Error guardando producto");
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // TIER HANDLERS (con orden automático)
  // ========================================================
  const addTier = () => {
    setProduct((prev) => ({
      ...prev,
      discountTiers: [
        ...prev.discountTiers,
        { quantity: 1, discount: 0 },
      ].sort((a, b) => a.quantity - b.quantity),
    }));
  };

  const updateTier = (index, field, value) => {
    const tiers = [...product.discountTiers];
    tiers[index][field] = Number(value);

    setProduct({
      ...product,
      discountTiers: tiers.sort((a, b) => a.quantity - b.quantity),
    });
  };

  const deleteTier = (index) => {
    const updated = product.discountTiers.filter((_, i) => i !== index);
    setProduct({
      ...product,
      discountTiers: updated.sort((a, b) => a.quantity - b.quantity),
    });
  };

  // ========================================================
  // WHATSAPP-LIKE PREVIEW
  // ========================================================
  const renderPreview = () => {
    if (!product.hasTiers || product.discountTiers.length === 0) return null;

    return (
      <div className="mt-3 p-2 border rounded" style={{ whiteSpace: "pre-line" }}>
        <strong>Vista previa:</strong>
        <div className="mt-2">
          <strong>{product.name}</strong>
          <br />
          Precio base: ${Number(product.price).toLocaleString("es-AR")}
          <br />
          Escalonadas:
          <ul className="mt-1">
            {product.discountTiers.map((t, i) => (
              <li key={i}>
                {t.quantity} unidades → {t.discount}% OFF
                {" "}
                ( ${Math.round(product.price * (1 - t.discount / 100)).toLocaleString("es-AR")} )
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // ========================================================
  // UI
  // ========================================================
  return (
    <div>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.text}</div>}

      <form onSubmit={handleSubmit}>
        {/* Nombre */}
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input
            className="form-control"
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            required
          />
        </div>

        {/* Precio */}
        <div className="mb-3">
          <label className="form-label">Precio</label>
          <input
            type="number"
            className="form-control"
            value={product.price}
            onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
            required
          />
        </div>

        {/* Categoría */}
        <div className="mb-3">
          <label className="form-label">Categoría</label>
          <input
            className="form-control"
            value={product.category}
            onChange={(e) =>
              setProduct({ ...product, category: e.target.value })
            }
          />
        </div>

        {/* Imagen actual */}
        {product.imageurl && (
          <div className="mb-3 text-center">
            <label className="form-label d-block">Imagen actual</label>
            <img
              src={normalizeImage(product.imageurl)}
              alt="producto"
              style={{ width: 120, borderRadius: 10 }}
            />
          </div>
        )}

        {/* Subir Imagen */}
        <div className="mb-3">
          <label className="form-label">Imagen (archivo)</label>
          <input
            type="file"
            accept="image/*"
            className="form-control"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Escalonadas */}
        <div className="form-check mb-2">
          <input
            className="form-check-input"
            type="checkbox"
            checked={product.hasTiers}
            onChange={(e) =>
              setProduct({ ...product, hasTiers: e.target.checked })
            }
          />
          <label className="form-check-label">
            Este producto tiene precios escalonados
          </label>
        </div>

        {/* EDIT Tiers */}
        {product.hasTiers && (
          <div className="mb-3 p-2 border rounded">
            <strong>Escalonadas</strong>

            {product.discountTiers.map((tier, index) => (
              <div key={index} className="d-flex gap-2 mb-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Cantidad mínima"
                  value={tier.quantity}
                  min={1}
                  onChange={(e) => updateTier(index, "quantity", e.target.value)}
                />

                <input
                  type="number"
                  className="form-control"
                  placeholder="Descuento %"
                  value={tier.discount}
                  min={0}
                  max={100}
                  onChange={(e) => updateTier(index, "discount", e.target.value)}
                />

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => deleteTier(index)}
                >
                  X
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-primary btn-sm mt-2"
              onClick={addTier}
            >
              + Agregar escalonada
            </button>
          </div>
        )}

        {/* Vista previa */}
        {renderPreview()}

        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-success" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>

          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
