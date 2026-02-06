import React, { useCallback, useEffect, useRef, useState } from "react";
import FlyerGenerator from "../components/FlyerGenerator";
import api from "../services/api";
import "./css/Flyerbuilder.css";
import { getCategories } from "../utils/getCategories";

// IMPORTS DE TEMPLATES
import black from "../../public/4.png";
import whiteFrame from "../../public/1.png";
import diagonal from "../../public/2.png";
import texture from "../../public/7.png";

const TEMPLATES = [
  { id: "black", name: "Black", src: black },
  { id: "white", name: "Frame", src: whiteFrame },
  { id: "diag", name: "Diagonal", src: diagonal },
  { id: "texture", name: "Texture", src: texture },
];

export default function FlyerBuilder() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [templateId, setTemplateId] = useState("black");
  const previewRef = useRef(null);
  const [search, setSearch] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get("/products");

      const prods = (res.data || []).map((p) => ({
        ...p,
        id: p.id ?? p._id,
        imageUrl: p.imageUrl || p.imageurl || p.image || p.imageURL || null,
      }));

      setProducts(prods);
    } catch (err) {
      console.error(err);
      alert("Error cargando productos");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, [loadProducts]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = prev === id ? null : id;
      if (next) {
        requestAnimationFrame(() => {
          previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      return next;
    });
  };

  const template = TEMPLATES.find((t) => t.id === templateId)?.src;

  const items = selected
    ? [products.find((p) => p.id === selected)].filter(Boolean)
    : [];

  // CATEGORIAS
  const [selectedCategory, setSelectedCategory] = useState("");
  const categories = getCategories(products);

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory ? p.category === selectedCategory : true;
    const matchSearch = search.trim()
      ? p.name?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchCategory && matchSearch;
  });

  return (
    <div className="container-fluid px-5">
      <h3 className="mb-3 mt-3">Generador de Flyers</h3>

      <div className="row g-0">
        {/* IZQUIERDA: selector + productos */}
        <div
          className="col-12 col-md-5 d-flex flex-column"
          style={{ height: "82vh" }}
        >
          <div className="d-flex flex-column gap-2 mb-3">
            <input
              type="text"
              className="form-control flyer-select"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flyer-select-wrapper">
              <select
                className="form-select mb-2 flyer-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className="row g-3"
            style={{ maxHeight: "74vh", overflowY: "auto", paddingRight: 6 }}
          >
            {filteredProducts.map((p) => (
              <div key={p.id} className="col-6">
                <div
                  className={`card p-2 ${
                    selected === p.id ? "border-primary" : ""
                  }`}
                  style={{
                    cursor: "pointer",
                    height: 240,
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onClick={() => toggleSelect(p.id)}
                >
                  <img
                    src={
                      p.imageUrl
                        ? p.imageUrl.startsWith("http")
                          ? p.imageUrl
                          : p.imageUrl
                        : "/placeholder.png"
                    }
                    alt={p.name}
                    style={{
                      width: "100%",
                      height: 130,
                      objectFit: "contain",
                      background: "rgba(242, 242, 242, 0.20)",
                      border: "solid 0.1px #00000033",
                      borderRadius: 8,
                    }}
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.png";
                    }}
                  />

                  <div className="mt-2">
                    <div className="fw-bold small">{p.name}</div>
                    <div className="small pt-2">${p.price}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DERECHA: preview */}
        <div ref={previewRef} className="col-12 col-md-7 ps-4">
          <h5 className="mb-3 ps-2">Preview</h5>
          <div className="flyer-select-wrapper">
            <select
              className="form-select mb-2 flyer-select"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            {items.length === 0 ? (
              <div className="text-muted">
                Seleccioná un producto para previsualizar
              </div>
            ) : (
              <FlyerGenerator
                template={template}
                items={items}
                layout="single"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
