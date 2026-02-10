import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { getCncData } from "../services/cnc";
import { useAuth } from "../context/useAuth";
import CncTable from "../components/CncTable";
import { PROMOTOR_IMAGES } from "../constants/promotorImages";
import "./css/cncPage.css";

const SHEETS = ["CNC UNG mes anterior", "CNC 500CC", "CNC H2Oh Still", "CNC Gatorade"];

export default function CncPage() {
  const { user, role } = useAuth();
  const token = localStorage.getItem("token");

  const [openSheets, setOpenSheets] = useState(() => new Set([SHEETS[0]]));
  const [cncBySheet, setCncBySheet] = useState({});

  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [sellerNumber, setSellerNumber] = useState("");
  const menuRef = useRef(null);

  const normalizeName = (value = "") =>
    value
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ");

  const getPromotorNumber = (name) => {
    if (!name) return null;
    const key = normalizeName(name);
    return PROMOTOR_IMAGES[key]?.number ?? null;
  };

  useEffect(() => {
    if (!token) return;
    SHEETS.forEach((sheetName) => {
      if (!cncBySheet[sheetName]) {
        loadCncSheet(sheetName);
      }
    });
    // eslint-disable-next-line
  }, [token]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setShowUploadMenu(false);
      }
    }

    if (showUploadMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showUploadMenu]);

  async function loadCncSheet(sheetName) {
    try {
      setCncBySheet((prev) => ({
        ...prev,
        [sheetName]: {
          data: prev[sheetName]?.data || [],
          loading: true,
          error: null,
        },
      }));

      const data = await getCncData({ sheet: sheetName, token });
      setCncBySheet((prev) => ({
        ...prev,
        [sheetName]: {
          data: data?.cnc || [],
          loading: false,
          error: null,
        },
      }));
    } catch (err) {
      setCncBySheet((prev) => ({
        ...prev,
        [sheetName]: {
          data: prev[sheetName]?.data || [],
          loading: false,
          error: err.message || "Error cargando CNC",
        },
      }));
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;

    try {
      setUploadMsg("Subiendo archivo…");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        "https://backend-nuevo.montesagus2001.workers.dev/cnc/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error subiendo CNC");

      setUploadMsg(`✔ ${data.rowsInserted} filas cargadas`);
      setFile(null);
      setCncBySheet({});
      openSheets.forEach((sheetName) => {
        loadCncSheet(sheetName);
      });
    } catch (err) {
      setUploadMsg(`❌ ${err.message}`);
    }
  }

  function toggleSheet(sheetName) {
    setOpenSheets((prev) => {
      const next = new Set(prev);
      if (next.has(sheetName)) {
        next.delete(sheetName);
      } else {
        next.add(sheetName);
        if (!cncBySheet[sheetName]) {
          loadCncSheet(sheetName);
        }
      }
      return next;
    });
  }

  // 🔒 filtro por promotor
  function getVisibleCnc(rows) {
    if (role === "admin") {
      const input = sellerNumber.trim();
      if (!input) return rows;
      return rows.filter((row) => {
        const number = getPromotorNumber(row.promotor_nombre);
        if (number === null || number === undefined) return false;
        return String(number) === input;
      });
    }

    return rows.filter((row) => row.promotor_nombre === user?.nombre_promotor);
  }

  return (
    <div className="cnc-page">
      {/* HEADER */}
      <div className="cnc-header">
        <div className="cnc-header-row">
          <div>
            <h1>ACCIONES CNC UNG</h1>
            <p>Clientes No Compradores del dia</p>
          </div>

          {role === "admin" && (
            <div className="cnc-header-actions" ref={menuRef}>
              <button
                type="button"
                className="cnc-actions-btn"
                onClick={() => setShowUploadMenu((prev) => !prev)}
                aria-label="Opciones de carga"
              >
                <MoreHorizontal size={18} />
              </button>
              {showUploadMenu && (
                <div className="cnc-actions-panel">
                  <form onSubmit={handleUpload}>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.xlsb"
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                    <button type="submit">Subir Excel</button>
                  </form>

                  {uploadMsg && (
                    <span className="cnc-upload-msg">{uploadMsg}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* TABS + UPLOAD */}
      <div className="cnc-top-row">
        <div className="cnc-filters">
          {role === "admin" && (
            <div className="cnc-filter">
              <label htmlFor="cnc-vendor" className="cnc-filter-label">
                Numero de vendedor
              </label>
              <input
                id="cnc-vendor"
                className="cnc-input"
                type="number"
                value={sellerNumber}
                onChange={(e) => setSellerNumber(e.target.value)}
                placeholder="Ej: 10"
              />
            </div>
          )}
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="cnc-sheet-list">
        {SHEETS.map((sheetName) => {
          const isOpen = openSheets.has(sheetName);
          const sheetState = cncBySheet[sheetName] || {
            data: [],
            loading: false,
            error: null,
          };
          const visibleCnc = getVisibleCnc(sheetState.data);

          return (
            <div key={sheetName} className="cnc-sheet-card">
              <button
                type="button"
                className="cnc-sheet-header"
                onClick={() => toggleSheet(sheetName)}
              >
                <span className="cnc-sheet-title">{sheetName}</span>
                <span className="cnc-sheet-count">{visibleCnc.length}</span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className="cnc-sheet-body"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {sheetState.loading && <CncLoader />}
                    {sheetState.error && (
                      <p className="cnc-error">{sheetState.error}</p>
                    )}
                    {!sheetState.loading && !sheetState.error && (
                      <CncTable data={visibleCnc} role={role} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===============================
   LOADER
================================ */

function CncLoader() {
  return (
    <div className="cnc-loader">
      <div className="spinner" />
      <span>Cargando CNC…</span>
    </div>
  );
}
