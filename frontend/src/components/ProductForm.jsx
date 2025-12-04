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
    imageUrl: null,
    imageurl: null, // backend key real
  });

  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const [imageFile, setImageFile] = useState(null); // archivo nuevo

  // ========================================================
  // 🔧 Normalizador universal de URLs
  // ========================================================
  const normalizeImage = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `https://precio-promo-backend.onrender.com${url}`;
  };

  // ========================================================
  // 🔄 Cargar producto si estoy editando
  // ========================================================
  useEffect(() => {
    if (!isEditing) return;

    api
      .get(`/products/${productId}`)
      .then((res) => {
        const data = res.data;

        setProduct({
          name: data.name || "",
          price: data.price || "",
          category: data.category || "",
          imageurl: data.imageurl || null,
          imageUrl: normalizeImage(data.imageurl || data.imageUrl),
          hasTiers: data.hasTiers || false,
          discountTiers: data.discountTiers || [],
        });
      })
      .catch(() =>
        setAlert({
          type: "danger",
          text: "No se pudo cargar el producto",
        })
      );
  }, [productId, isEditing]);

  const showAlert = (type, text, timeout = 4000) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), timeout);
  };

  // ========================================================
  // 🧹 Procesamiento de imagen (quitar fondo)
  // ========================================================
  const processImage = async (file) => {
    if (!file) return null;

    const blobToFile = (blob, name) => {
      const filename = name.replace(/\.[^/.]+$/, "") + ".png";
      return new File([blob], filename, { type: "image/png" });
    };

    try {
      const mod = await import("@imgly/background-removal");
      const removeBackground =
        mod.removeBackground || mod.default || mod.imglyRemoveBackground;

      if (typeof removeBackground === "function") {
        const result = await removeBackground(file);
        return result instanceof Blob ? blobToFile(result, file.name) : result;
      }
    } catch (_) {}

    // fallback
    try {
      const CDN =
        "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/dist/browser.mjs";

      const remote = await import(/* @vite-ignore */ CDN);
      const removeBackground =
        remote.removeBackground ||
        remote.default ||
        remote.imglyRemoveBackground;

      if (typeof removeBackground === "function") {
        const result = await removeBackground(file);
        return result instanceof Blob ? blobToFile(result, file.name) : result;
      }
    } catch (err) {
      console.warn("Dynamic import fallback failed", err);
    }

    showAlert(
      "warning",
      "No se pudo remover el fondo automáticamente; se subirá la imagen original."
    );
    return file;
  };

  // ========================================================
  // 💾 Guardar producto
  // ========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product.name || !product.price) {
      showAlert("danger", "Complete nombre y precio");
      return;
    }

    setSaving(true);

    try {
      let imageUrl = product.imageurl || null;

      if (imageFile) {
        const cleanFile = await processImage(imageFile);

        const fd = new FormData();
        fd.append("image", cleanFile);

        const uploadRes = await api.post("/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        imageUrl = uploadRes.data.file;
      }

      const payload = {
        name: product.name,
        price: product.price,
        category: product.category,
        imageurl: imageUrl,
        hasTiers: product.hasTiers || false,
        discountTiers: product.discountTiers || [],
      };

      if (isEditing) {
        await api.put(`/products/${productId}`, payload);
      } else {
        await api.post("/products", payload);
      }

      showAlert(
        "success",
        isEditing ? "Producto actualizado" : "Producto creado"
      );

      setTimeout(() => onClose?.(), 900);
    } catch (err) {
      console.error(err);
      showAlert("danger", "Error guardando producto");
    } finally {
      setSaving(false);
    }
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
            onChange={(e) => setProduct({ ...product, price: e.target.value })}
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

        
        {/* Vista previa de imagen */}
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

        {/* Cargar nueva imagen */}
        <div className="mb-3">
          <label className="form-label">Imagen (archivo)</label>
          <input
            type="file"
            accept="image/*"
            className="form-control"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setImageFile(file);
            }}
          />
          <div className="form-text">
            Si es posible, la app quitará el fondo automáticamente
          </div>
        </div>

        {/* Botones */}
        <div className="d-flex gap-2">
          <button className="btn btn-success" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>

          {onClose && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

