// src/components/ProductForm.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function ProductForm({ productId, onClose }) {
  const isEditing = Boolean(productId);

  const [product, setProduct] = useState({
    name: "",
    price: "",
    category: "",
    image: "",
  });

  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  // archivo seleccionado por el usuario (puede ser el original o el "limpio")
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (isEditing) {
      api
        .get(`/products/${productId}`)
        .then((res) => setProduct(res.data))
        .catch(() =>
          setAlert({
            type: "danger",
            text: "No se pudo cargar el producto",
          })
        );
    }
  }, [productId, isEditing]);

  const showAlert = (type, text, timeout = 4000) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), timeout);
  };

  /**
   * processImage(file)
   * - Intenta remover el fondo usando @imgly/background-removal.
   * - Usa import normal si está instalado; si falla, intenta un dynamic import del bundle para navegador via jsdelivr.
   * - Devuelve un File (image/png) con fondo removido o, en fallback, el file original.
   */
  const processImage = async (file) => {
    if (!file) return null;

    // helper: convierte Blob -> File con extension .png
    const blobToFile = (blob, name) => {
      const filename = name.replace(/\.[^/.]+$/, "") + ".png";
      return new File([blob], filename, { type: "image/png" });
    };

    // primero intentamos la importación estática (si instalaste la librería)
    try {
      // try to import the package normally (works when installed and bundler resolves)
      // eslint-disable-next-line no-unused-vars
      const mod = await import("@imgly/background-removal");
      // prefer exported name removeBackground (package exports it)
      const removeBackground =
        mod.removeBackground || mod.default || mod.imglyRemoveBackground;
      if (typeof removeBackground === "function") {
        const result = await removeBackground(file);
        // result puede ser Blob o File; normalizamos a File png
        if (result instanceof Blob) return blobToFile(result, file.name);
        if (result instanceof File) return result;
      }
    } catch (err) {
      // no hacemos nada aquí; vamos al fallback dinámico
      // console.warn("Import local @imgly/background-removal falló:", err);
    }

    // fallback dinámico: cargar bundle preparado para browser desde jsDelivr
    try {
      // versión fija del paquete para estabilidad; podés ajustar la versión si querés
      const CDN =
        "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/dist/browser.mjs";
      const remote = await import(/* @vite-ignore */ CDN);
      const removeBackground =
        remote.removeBackground ||
        remote.default ||
        remote.imglyRemoveBackground;
      if (typeof removeBackground === "function") {
        const result = await removeBackground(file);
        if (result instanceof Blob) return blobToFile(result, file.name);
        if (result instanceof File) return result;
      }
    } catch (err) {
      console.warn("Dynamic import CDN background-removal falló:", err);
    }

    // Si llegamos acá, no pudimos remover el fondo; avisamos y devolvemos original
    showAlert(
      "warning",
      "No se pudo remover el fondo automáticamente; la imagen se subirá con su fondo original."
    );
    return file;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product.name || !product.price) {
      showAlert("danger", "Complete nombre y precio");
      return;
    }

    setSaving(true);

    try {
      let imageUrl = product.imageurl || null; // ✅ importante

      // Si hay archivo seleccionado, lo procesamos y lo subimos
      if (imageFile) {
        const cleanFile = await processImage(imageFile);

        if (!cleanFile) {
          throw new Error("No se obtuvo archivo para subir");
        }

        const fd = new FormData();
        fd.append("image", cleanFile);

        const uploadRes = await api.post("/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        imageUrl = uploadRes.data.file; // ✅ ruta del backend
      }

      // ✅ PAYLOAD CORRECTO PARA TU BASE DE DATOS
      const payload = {
        name: product.name,
        price: product.price,
        category: product.category,
        imageurl: imageUrl, // ✅ CLAVE FINAL
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

      setTimeout(() => {
        if (onClose) onClose();
      }, 900);
    } catch (err) {
      console.error(err);
      showAlert("danger", "Error guardando producto");
    } finally {
      setSaving(false);
    }
  };

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
              src={`https://precio-promo-backend.onrender.com${product.imageurl}`}
              alt="producto"
              style={{ width: 120, borderRadius: 10 }}
            />
          </div>
        )}

        {/* Subir nueva imagen */}
        <div className="mb-3">
          <label className="form-label">Imagen (archivo)</label>
          <input
            type="file"
            accept="image/*"
            className="form-control"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setImageFile(file); // guardamos el original; processImage se ejecuta al enviar
              }
            }}
          />
          <div className="form-text">
            La app intentará quitar el fondo automáticamente al guardar. Si
            falla, la imagen se subirá tal cual.
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
