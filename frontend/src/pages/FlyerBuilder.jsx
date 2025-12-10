import React, { useEffect, useState } from "react";
import FlyerGenerator from "../components/FlyerGenerator";
import api from "../services/api";
import "./css/Flyerbuilder.css";

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

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get("/products");

      const prods = (res.data || []).map((p) => ({
        ...p,
        id: p.id ?? p._id,
        imageUrl:
          p.imageUrl ||
          p.imageurl ||
          p.image ||
          p.imageURL ||
          null,
      }));

      setProducts(prods);
    } catch (err) {
      console.error(err);
      alert("Error cargando productos");
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => (prev === id ? null : id));
  };

  const template = TEMPLATES.find((t) => t.id === templateId)?.src;

  const items = selected
    ? [products.find((p) => p.id === selected)].filter(Boolean)
    : [];

  return (
    <div className="container-fluid px-5">
      <h3 className="mb-3 mt-3">Generador de Flyers</h3>

      <div className="row g-0">
        {/* IZQUIERDA: selector + productos */}
        <div
          className="col-12 col-md-5 d-flex flex-column"
          style={{ height: "100vh" }}
        >
          <div className="d-flex gap-2 mb-3">
            <select
              className="form-select mb-2 flyer-select"
              style={{ 
                width: 220,
               }}
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
            className="row g-3"
            style={{ maxHeight: "74vh", overflowY: "auto", paddingRight: 6 }}
          >
            {products.map((p) => (
              <div key={p.id} className="col-4">
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
                    <div className="small text-muted">${p.price}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DERECHA: preview */}
        <div className="col-12 col-md-7">
          <h5 className="mb-2">Preview</h5>

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
