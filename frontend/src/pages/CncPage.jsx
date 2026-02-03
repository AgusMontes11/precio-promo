import { useEffect, useState } from "react";
import { getCncData } from "../services/cnc";
import { useAuth } from "../context/useAuth";
import CncTable from "../components/CncTable";
import "./css/cncPage.css";

const SHEETS = ["CNC UNG mes anterior", "CNC 500CC", "CNC H2Oh Still", "CNC Gatorade"];

export default function CncPage() {
  const { user, role } = useAuth();
  const token = localStorage.getItem("token");

  const [sheet, setSheet] = useState("CNC UNG mes anterior");
  const [cnc, setCnc] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    loadCnc();
    // eslint-disable-next-line
  }, [sheet, token]);

  async function loadCnc() {
    try {
      setLoading(true);
      setError(null);

      const data = await getCncData({ sheet, token });
      setCnc(data?.cnc || []);
    } catch (err) {
      setError(err.message || "Error cargando CNC");
    } finally {
      setLoading(false);
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
      loadCnc();
    } catch (err) {
      setUploadMsg(`❌ ${err.message}`);
    }
  }

  // 🔒 filtro por promotor
  const visibleCnc =
    role === "admin"
      ? cnc
      : cnc.filter(
          (c) => c.promotor_nombre === user?.nombre_promotor
        );

  return (
    <div className="cnc-page">
      {/* HEADER */}
      <div className="cnc-header">
        <h1>CNC</h1>
        <p>Clientes No Compradores del día</p>
      </div>

      {/* TABS + UPLOAD */}
      <div className="cnc-top-row">
        <div className="cnc-tabs">
          {SHEETS.map((s) => (
            <button
              key={s}
              className={`cnc-tab ${sheet === s ? "active" : ""}`}
              onClick={() => setSheet(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {role === "admin" && (
          <div className="cnc-upload">
            <form onSubmit={handleUpload}>
              <input
                type="file"
                accept=".xlsx,.xls"
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

      {/* CONTENIDO */}
      <div className="cnc-card">
        {loading && <CncLoader />}
        {error && <p className="cnc-error">{error}</p>}

        {!loading && !error && (
          <CncTable
            data={visibleCnc}
            role={role}   // 🔑 CLAVE
          />
        )}
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
