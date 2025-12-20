import { useEffect, useState } from "react";
import { getCncData } from "../services/cnc";
import { useAuth } from "../context/AuthContext";
import CncTable from "../components/CncTable";

export default function CncPage() {
  const { user, role } = useAuth();
  const token = localStorage.getItem("token");

  const [sheet, setSheet] = useState("CNC UNG");
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
      setCnc(data.cnc);
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
      setUploadMsg("Subiendo archivo...");

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

  const visibleCnc =
    role === "admin"
      ? cnc
      : cnc.filter(
          (c) => c.promotor_nombre === user?.nombre_promotor
        );

  return (
    <div style={{ padding: 24 }}>
      <h2>CNC</h2>

      {/* Selector de hoja */}
      <select
        value={sheet}
        onChange={(e) => setSheet(e.target.value)}
      >
        <option value="CNC UNG">CNC UNG</option>
        <option value="CNC Gatorade">CNC GATORADE</option>
      </select>

      {/* UPLOAD SOLO ADMIN */}
      {role === "admin" && (
        <form onSubmit={handleUpload} style={{ marginTop: 16 }}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button type="submit">Subir Excel</button>
          {uploadMsg && <p>{uploadMsg}</p>}
        </form>
      )}

      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <CncTable data={visibleCnc} />
      )}
    </div>
  );
}
