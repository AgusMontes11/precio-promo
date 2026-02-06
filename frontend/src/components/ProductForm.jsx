import React, { useEffect, useState } from "react";
import api from "../services/api";
import { uploadToCloudinary } from "../services/cloudinary";
import "./css/ProductForm.css";

export default function ProductForm({ productId, onClose }) {
  const isEditing = Boolean(productId);

  const [product, setProduct] = useState({
    name: "",
    price: "",
    category: "",
    imageUrl: null,
    hasTiers: false,
    discountTiers: [],
  });

  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [removeBg, setRemoveBg] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);

  const normalizeImage = (url) => {
    if (!url) return null;
    return url.startsWith("http") ? url : url;
  };

  const buildImageVariants = (url) => {
    if (!url) return null;
    const normalized = normalizeImage(url);
    const withoutBg = "/upload/e_background_removal/";
    const baseUrl = normalized.includes(withoutBg)
      ? normalized.replace(withoutBg, "/upload/")
      : normalized;
    const removedBgUrl = baseUrl.includes("/upload/")
      ? baseUrl.replace("/upload/", withoutBg)
      : null;
    return { originalUrl: baseUrl, removedBgUrl };
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
          imageUrl:
            data.imageUrl ||
            data.imageurl ||
            data.imageURL ||
            data.image ||
            null,
          hasTiers: data.has_tiers || false,
          discountTiers: Array.isArray(data.discount_tiers)
            ? data.discount_tiers
            : [],
        });
        const existingUrl =
          data.imageUrl ||
          data.imageurl ||
          data.imageURL ||
          data.image ||
          null;
        const variants = buildImageVariants(existingUrl);
        setUploadedImage(variants);
        setRemoveBg(Boolean(existingUrl?.includes("/upload/e_background_removal/")));
      })
      .catch(() =>
        setAlert({ type: "danger", text: "No se pudo cargar el producto" })
      );
  }, [productId, isEditing]);

  useEffect(() => {
    if (product.imageUrl) {
      setPreviewLoading(true);
    }
  }, [product.imageUrl]);

  const showAlert = (type, text, timeout = 4000) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), timeout);
  };

  const pickImageUrl = (img, wantsRemoveBg) => {
    if (!img) return null;
    if (wantsRemoveBg && img.removedBgUrl) return img.removedBgUrl;
    return img.originalUrl;
  };

  const handleImageSelect = async (file) => {
    setImageFile(file || null);
    setUploadedImage(null);

    if (!file) return;

    setUploadingImage(true);
    setPreviewLoading(true);
    try {
      const result = await uploadToCloudinary(file);
      setUploadedImage(result);
      const nextUrl = pickImageUrl(result, removeBg);
      setProduct((prev) => ({ ...prev, imageUrl: nextUrl }));
    } catch (err) {
      console.error(err);
      showAlert(
        "danger",
        "No se pudo procesar la imagen. Probá otra o desactivá el recorte."
      );
    } finally {
      setUploadingImage(false);
    }
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
      let imageUrl = product.imageUrl || null;

      if (uploadingImage) {
        showAlert("danger", "Esperá a que termine la carga de la imagen");
        setSaving(false);
        return;
      }

      if (imageFile && !uploadedImage) {
        const result = await uploadToCloudinary(imageFile);
        setUploadedImage(result);
        imageUrl = pickImageUrl(result, removeBg);
      } else if (uploadedImage) {
        imageUrl = pickImageUrl(uploadedImage, removeBg);
      }

      const payload = {
        name: product.name,
        price: Number(product.price),
        category: product.category || null,
        imageUrl,
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
        {product.imageUrl && (
          <div className="mb-3 text-center product-image-preview">
            <label className="form-label d-block">Imagen actual</label>
            <img
              src={normalizeImage(product.imageUrl)}
              alt="producto"
              style={{ width: 120, borderRadius: 10 }}
              onLoad={() => setPreviewLoading(false)}
              onError={() => setPreviewLoading(false)}
            />
            {(uploadingImage || previewLoading) && (
              <div className="product-image-loading">
                <div className="product-image-spinner" />
              </div>
            )}
          </div>
        )}

        {/* Nueva imagen */}
        <div className="mb-3">
          <label className="form-label">Imagen (archivo)</label>
          <input
            type="file"
            accept="image/*"
            className="form-control"
            onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            checked={removeBg}
            onChange={(e) => {
              const checked = e.target.checked;
              setRemoveBg(checked);
              const source = uploadedImage || buildImageVariants(product.imageUrl);
              if (!uploadedImage && source) setUploadedImage(source);
              const nextUrl = pickImageUrl(source, checked);
              if (nextUrl) {
                setPreviewLoading(true);
                setProduct((prev) => ({ ...prev, imageUrl: nextUrl }));
              }
            }}
            disabled={uploadingImage}
          />
          <label className="form-check-label">
            Quitar fondo automaticamente (si falla, desactivarlo)
          </label>
        </div>

        {/* Tiers */}
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
