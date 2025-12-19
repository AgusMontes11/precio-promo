// src/pages/CncPage.jsx
import { useEffect, useState } from "react";
import { getCncData } from "../services/cnc";
import { useAuth } from "../context/AuthContext";
import CncTable from "../components/CncTable";

export default function CncPage() {
  const { user, token } = useAuth();

  const [sheet, setSheet] = useState("CNC UNG");
  const [cnc, setCnc] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCnc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet]);

  async function loadCnc() {
    try {
      setLoading(true);
      setError(null);

      const data = await getCncData({
        sheet,
        token,
      });

      setCnc(data.cnc || []);
    } catch (err) {
      setError(err.message || "Error cargando CNC");
    } finally {
      setLoading(false);
    }
  }

  // 🔒 Filtro por rol
  const visibleCnc = !user
    ? []
    : user.role === "admin"
    ? cnc
    : cnc.filter(
        (c) => c.promotor_nombre === user.nombre_promotor
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
        <option value="CNC GATORADE">CNC GATORADE</option>
      </select>

      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <CncTable data={visibleCnc} />
      )}
    </div>
  );
}
