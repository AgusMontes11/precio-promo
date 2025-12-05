import React, { useRef, useEffect, useState } from "react";
import * as htmlToImage from "html-to-image";
import api from "../services/api";

// ============================================================
// CONFIGURACIÓN DE TEMPLATES
// ============================================================
const TEMPLATE_CONFIG = {
  black: {
    imageSizeRatio: 0.85,
    imageTopRatio: 0.13,
    nameTopRatio: 0.62,
    priceAbsolute: true,
    priceLeft: 100,
    priceBottom: 310,
    priceFontRatio: 0.075,
    nameFontRatio: 0.065,
    dark: true,
  },
  white: {
    imageSizeRatio: 1.2,
    imageTopRatio: 0.16,
    nameTopRatio: 0.66,
    priceTopRatio: 0.9,
    priceAbsolute: false,
    priceFontRatio: 0.085,
    nameFontRatio: 0.06,
    dark: false,
  },
  diag: {
    imageSizeRatio: 0.8,
    imageTopRatio: 0.15,
    nameTopRatio: 0.66,
    priceTopRatio: 0.78,
    priceAbsolute: false,
    priceFontRatio: 0.09,
    nameFontRatio: 0.06,
    dark: true,
  },
  texture: {
    imageSizeRatio: 0.4,
    imageTopRatio: 0.15,
    nameTopRatio: 0.62,
    priceTopRatio: 0.72,
    priceAbsolute: false,
    priceFontRatio: 0.06,
    nameFontRatio: 0.055,
    dark: false,
  },
};

// Vite renombra las imágenes a algo como "4-asd98asd.png"
// Por eso buscamos por prefijo del archivo original.
const TEMPLATE_KEY_BY_NAME = {
  "4": "black",
  "1": "white",
  "2": "diag",
  "7": "texture",
};

// ============================================================
// Helpers
// ============================================================
function CurvedText({ text, radius, fontSize, color, shadow }) {
  return (
    <svg
      width="100%"
      height={fontSize * 4}
      style={{ overflow: "visible", position: "absolute" }}
    >
      <defs>
        <path
          id="curvePath"
          d={`M 50 ${radius} A ${radius} ${radius} 0 0 1 330 ${radius}`}
          fill="none"
        />
      </defs>
      <text
        fill={color}
        fontSize={fontSize}
        fontWeight="900"
        textAnchor="middle"
        style={{
          filter: shadow
            ? "drop-shadow(0 3px 10px rgba(255,255,255,0.85))"
            : "none",
        }}
      >
        <textPath href="#curvePath" startOffset="50%">
          {text}
        </textPath>
      </text>
    </svg>
  );
}

// Detecta correctamente la key del template con imports de Vite
function guessTemplateKey(templateSrc) {
  if (!templateSrc) return "black";

  const low = templateSrc.toLowerCase();

  for (const prefix of Object.keys(TEMPLATE_KEY_BY_NAME)) {
    if (
      low.includes(`/${prefix}.`) ||
      low.includes(`/${prefix}-`) ||
      low.includes(`${prefix}.`) ||
      low.includes(`${prefix}-`)
    ) {
      return TEMPLATE_KEY_BY_NAME[prefix];
    }
  }

  return "black"; // fallback
}

// Normaliza la imagen del producto
function normalizeImg(product) {
  const url =
    product?.imageUrl ||
    product?.imageurl ||
    product?.image ||
    product?.imageURL ||
    null;

  if (!url) return "/placeholder.png";

  return url.startsWith("http")
    ? url
    : `https://precio-promo-backend.onrender.com${url}`;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function FlyerGenerator({ template, items = [], layout = "single" }) {
  const previewRef = useRef(null);
  const [previewSize, setPreviewSize] = useState({ w: 0, h: 0 });

  const templateKey = guessTemplateKey(template);
  const cfg = TEMPLATE_CONFIG[templateKey] || TEMPLATE_CONFIG.black;

  // ============================================================
  // Medir preview dinámicamente
  // ============================================================
  useEffect(() => {
    function updateSize() {
      const node = previewRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      setPreviewSize({ w: rect.width, h: rect.height });
    }
    updateSize();

    window.addEventListener("resize", updateSize);
    const tid = setTimeout(updateSize, 80);

    return () => {
      window.removeEventListener("resize", updateSize);
      clearTimeout(tid);
    };
  }, [template, items]);

  // ============================================================
  // EXPORTAR FLYER
  // ============================================================
  const exportHighRes = async () => {
    try {
      const element = previewRef.current;
      if (!element) return;

      const dataUrl = await htmlToImage.toPng(element, {
        cacheBust: true,
        skipFonts: true,
        filter: (el) => el.tagName !== "LINK",
      });

      const link = document.createElement("a");
      link.download = `${templateKey}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      await api.post("/stats/flyers/increment");
      window.dispatchEvent(new Event("flyer-generated"));
    } catch (e) {
      console.error("Error exportando flyer:", e);
    }
  };

  // ============================================================
  // RENDER DEL PREVIEW
  // ============================================================
  const renderSinglePreview = (product) => {
    if (!product || previewSize.w === 0) return null;

    const W = previewSize.w;
    const H = previewSize.h;

    const size = Math.round(W * cfg.imageSizeRatio);
    const imageTop = Math.round(H * cfg.imageTopRatio);
    const nameTop = Math.round(H * cfg.nameTopRatio);
    const priceTop = cfg.priceAbsolute ? null : Math.round(H * (cfg.priceTopRatio || 0.7));

    const nameFont = Math.round(W * cfg.nameFontRatio);
    const priceFont = Math.round(W * cfg.priceFontRatio);

    const textShadow = cfg.dark ? "0 3px 10px rgba(255,255,255,0.85)" : "none";

    return (
      <>
        {/* IMAGEN */}
        <img
          src={normalizeImg(product)}
          alt={product.name}
          style={{
            position: "absolute",
            left: "50%",
            top: `${imageTop}px`,
            transform: "translateX(-50%)",
            width: `${size}px`,
            height: `${size}px`,
            objectFit: "cover",
            borderRadius: 16,
          }}
        />

        {/* NOMBRE (curvo solo en white) */}
        {templateKey === "white" ? (
          <div
            style={{
              position: "absolute",
              top: `${nameTop - 180}px`,
              left: -60,
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <CurvedText
              text={product.name.toUpperCase()}
              radius={100}
              fontSize={nameFont}
              color="#FFFC7D"
              shadow={cfg.dark}
            />
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              top: `${nameTop}px`,
              left: "50%",
              transform: "translateX(-50%)",
              width: `${0.75 * W}px`,
              textAlign: "center",
              fontWeight: 900,
              fontSize: `${nameFont}px`,
              color: "#000",
              textShadow,
              textTransform: "uppercase",
              wordWrap: "break-word",
            }}
          >
            {product.name.toUpperCase()}
          </div>
        )}

        {/* PRECIO */}
        <div
          style={{
            position: "absolute",
            ...(cfg.priceAbsolute
              ? {
                  left: cfg.priceLeft * (W / 1080),
                  bottom: cfg.priceBottom * (H / 1920),
                }
              : {
                  left: 0,
                  top: `${priceTop}px`,
                  width: "100%",
                  textAlign: "center",
                }),
            color: "#006400",
            fontWeight: 800,
            fontSize: `${priceFont}px`,
            textShadow,
          }}
        >
          ${Number(product.price).toLocaleString("es-AR")}
        </div>
      </>
    );
  };

  return (
    <div>
      {/* PREVIEW */}
      <div
        ref={previewRef}
        id="flyer-preview"
        style={{
          width: "100%",
          maxWidth: 380,
          aspectRatio: "9 / 16",
          position: "relative",
          overflow: "hidden",
          backgroundImage: `url(${template})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 14,
          boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
          marginTop: 10,
        }}
      >
        {layout === "single" && items[0] && renderSinglePreview(items[0])}
      </div>

      {/* BOTÓN DESCARGA */}
      <div className="mt-3 d-flex gap-2">
        <button className="btn btn-success" onClick={exportHighRes}>
          Descargar flyer (alta resolución)
        </button>
      </div>
    </div>
  );
}
