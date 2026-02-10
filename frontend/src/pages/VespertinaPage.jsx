import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import VespertinaCarousel from "../components/VespertinaCarousel";
import {
  getMatinalData,
  getMatinalSalesStatus,
  setMatinalSalesStatus,
  uploadMatinalExcel,
} from "../services/matinal";
import "./css/matinalPage.css";

export default function VespertinaPage({ hideHeader = false, refreshKey = 0 }) {
  const { role } = useAuth();
  const token = localStorage.getItem("token");

  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dia, setDia] = useState("");
  const [salesStatus, setSalesStatus] = useState({});

  const [promotorId, setPromotorId] = useState("");
  const [clientQuery, setClientQuery] = useState("");

  useEffect(() => {
    if (!token) return;
    loadVespertina();
    loadSalesStatus();
    // eslint-disable-next-line
  }, [token, role, refreshKey]);

  async function loadVespertina(customPromotorId) {
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
      setError(err.message || "Error cargando Vespertina");
    } finally {
      setLoading(false);
    }
  }

  async function loadSalesStatus() {
    try {
      const data = await getMatinalSalesStatus({ token });
      const next = {};
      (data?.items || []).forEach((item) => {
        if (!item?.codigo_pdv || !item?.accion) return;
        const key = `${item.codigo_pdv}__${item.accion}`;
        next[key] = Boolean(item.sold);
      });
      setSalesStatus(next);
    } catch (err) {
      setError(err.message || "Error cargando estado de ventas");
    }
  }

  async function handleAdminFilter(e) {
    e.preventDefault();
    await loadVespertina(promotorId || null);
  }

  async function handleToggleSale({ codigo_pdv, accion, sold }) {
    try {
      await setMatinalSalesStatus({ token, codigo_pdv, accion, sold });
      const key = `${codigo_pdv}__${accion}`;
      setSalesStatus((prev) => ({ ...prev, [key]: sold }));
    } catch (err) {
      setError(err.message || "Error guardando estado de ventas");
      throw err;
    }
  }

  return (
    <div className={hideHeader ? "matinal-page matinal-embedded" : "matinal-page"}>
      {!hideHeader && (
        <div className="matinal-header">
          <h1>PLAN COMERCIAL VESPERTINO</h1>
          <p>Acciones comerciales por cliente (vista clientes)</p>
        </div>
      )}

      <div className="matinal-top-row">
        <div className="matinal-filters">
          <div className="matinal-filter">
            <label>
              Buscar cliente
              <input
                type="text"
                value={clientQuery}
                onChange={(e) => setClientQuery(e.target.value)}
                placeholder="Cliente o codigo PDV"
              />
            </label>
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
        </div>
      </div>

      <div className="matinal-card">
        <div className="matinal-card-top">
          <span className="matinal-card-heading">Clientes</span>
          <span className="matinal-badge">Dia: {dia || "-"}</span>
        </div>
        {loading && <VespertinaLoader />}
        {error && <p className="matinal-error">{error}</p>}
        {!loading && !error && (
          <VespertinaCarousel
            actions={actions}
            salesStatus={salesStatus}
            onToggleSale={handleToggleSale}
            clientQuery={clientQuery}
          />
        )}
      </div>
    </div>
  );
}

function VespertinaLoader() {
  return (
    <div className="matinal-loader">
      <div className="spinner" />
      <span>Cargando Vespertina...</span>
    </div>
  );
}
