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

  const normalizeImage = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return url;
  };

  // ========================================================
  // REMOVE BACKGROUND (RECORTE)
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
      console.warn("Fallback failed", err);
    }

    return file; // fallback final
  };

  // ========================================================
  // LOAD PRODUCT WHEN EDITING
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
          hasTiers: data.has_tiers || false,
          discountTiers: Array.isArray(data.discount_tiers)
            ? data.discount_tiers
            : [],
        });
      })
      .catch(() =>
        setAlert({ type: "danger", text: "No se pudo cargar el producto" })
      );
  }, [productId, isEditing]);

  const showAlert = (type, text, timeout = 4000) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), timeout);
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

    setSaving(true);

    try {
      let imageUrl = product.imageurl || null;

      if (imageFile) {
        const cleanFile = await processImage(imageFile);

        const fd = new FormData();
        fd.append("image", cleanFile);

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

        fd.append("file", cleanFile);
        fd.append("upload_preset", preset);

        const uploadRes = await fetch(cloudinaryUrl, {
          method: "POST",
          body: fd,
        });

        const data = await uploadRes.json();

        if (!data.secure_url) {
          throw new Error("Cloudinary no devolvió URL");
        }

        imageUrl = data.secure_url; //ACÁ YA TENÉS LA URL FINAL

      }

      const payload = {
        name: product.name,
        price: Number(product.price),
        category: product.category || null,
        imageurl: imageUrl,
        has_tiers: product.hasTiers,
        discount_tiers: product.discountTiers,
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
  // TIERS HANDLERS
  // ========================================================
  const addTier = () => {
    setProduct({
      ...product,
      discountTiers: [...product.discountTiers, { quantity: 1, discount: 0 }],
    });
  };

  const updateTier = (index, field, value) => {
    const tiers = [...product.discountTiers];
    tiers[index][field] = value;
    setProduct({ ...product, discountTiers: tiers });
  };

  const deleteTier = (index) => {
    const tiers = [...product.discountTiers];
    tiers.splice(index, 1);
    setProduct({ ...product, discountTiers: tiers });
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

        {/* Subir imagen nueva */}
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

        {product.hasTiers && (
          <div className="mb-3 p-2 border rounded">
            <strong>Escalonadas</strong>

            {product.discountTiers.length === 0 && (
              <div className="text-muted small">
                No hay escalonadas cargadas
              </div>
            )}

            {product.discountTiers.map((tier, index) => (
              <div key={index} className="d-flex gap-2 mb-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Cantidad mínima"
                  value={tier.quantity}
                  onChange={(e) =>
                    updateTier(index, "quantity", Number(e.target.value))
                  }
                />

                <input
                  type="number"
                  className="form-control"
                  placeholder="Descuento %"
                  value={tier.discount}
                  onChange={(e) =>
                    updateTier(index, "discount", Number(e.target.value))
                  }
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

        {/* Botones */}
        <div className="d-flex gap-2">
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
