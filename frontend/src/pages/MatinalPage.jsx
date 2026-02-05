import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import MatinalCarousel from "../components/MatinalCarousel";
import { getMatinalData, uploadMatinalExcel } from "../services/matinal";
import "./css/matinalPage.css";

export default function MatinalPage() {
  const { role } = useAuth();
  const token = localStorage.getItem("token");

  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dia, setDia] = useState("");

  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");

  const [promotorId, setPromotorId] = useState("");

  useEffect(() => {
    if (!token) return;
    loadMatinal();
    // eslint-disable-next-line
  }, [token, role]);

  async function loadMatinal(customPromotorId) {
    try {
      setLoading(true);
      setError(null);

      const data = await getMatinalData({
        token,
        promotorId: customPromotorId || null,
      });
      setActions(data?.actions || []);
      setDia(data?.dia || "");
    } catch (err) {
      setError(err.message || "Error cargando Matinal");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;

    try {
      setUploadMsg("Subiendo archivo…");
      const data = await uploadMatinalExcel({ file, token });
      setUploadMsg(`✔ ${data.rowsInserted} filas cargadas`);
      setFile(null);
      await loadMatinal(role === "admin" ? promotorId : null);
    } catch (err) {
      setUploadMsg(`❌ ${err.message}`);
    }
  }

  async function handleAdminFilter(e) {
    e.preventDefault();
    await loadMatinal(promotorId || null);
  }

  return (
    <div className="matinal-page">
      <div className="matinal-header">
        <h1>PLAN COMERCIAL</h1>
        <p>Acciones comerciales por cliente</p>
      </div>

      <div className="matinal-top-row">
        <div className="matinal-info">
          <span className="matinal-badge">Día: {dia || "-"}</span>
        </div>

        {role === "admin" && (
          <form className="matinal-filter" onSubmit={handleAdminFilter}>
            <label>
              Promotor ID
              <input
                type="number"
                value={promotorId}
                onChange={(e) => setPromotorId(e.target.value)}
                placeholder="Ej: 10"
              />
            </label>
            <button type="submit">Filtrar</button>
          </form>
        )}

        {role === "admin" && (
          <div className="matinal-upload">
            <form onSubmit={handleUpload}>
              <input
                type="file"
                accept=".xlsx,.xls,.xlsb"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <button type="submit">Subir Excel</button>
            </form>

            {uploadMsg && (
              <span className="matinal-upload-msg">{uploadMsg}</span>
            )}
          </div>
        )}
      </div>

      <div className="matinal-card">
        {loading && <MatinalLoader />}
        {error && <p className="matinal-error">{error}</p>}
        {!loading && !error && <MatinalCarousel actions={actions} />}
      </div>
    </div>
  );
}

function MatinalLoader() {
  return (
    <div className="matinal-loader">
      <div className="spinner" />
      <span>Cargando Matinal…</span>
    </div>
  );
}
