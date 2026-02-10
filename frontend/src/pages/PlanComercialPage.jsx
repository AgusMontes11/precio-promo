import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { uploadMatinalExcel } from "../services/matinal";
import MatinalPage from "./MatinalPage";
import VespertinaPage from "./VespertinaPage";
import "./css/matinalPage.css";

export default function PlanComercialPage() {
  const { role } = useAuth();
  const token = localStorage.getItem("token");
  const [activeTab, setActiveTab] = useState("matinal");
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const menuRef = useRef(null);

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

  async function handleUpload(e) {
    e.preventDefault();
    if (!file || !token) return;

    try {
      setUploadMsg("Subiendo archivo...");
      const data = await uploadMatinalExcel({ file, token });
      setUploadMsg(`✔ ${data.rowsInserted} filas cargadas`);
      setFile(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      setUploadMsg(`❌ ${err.message}`);
    }
  }

  return (
    <div className="matinal-page">
      <div className="matinal-header">
        <div className="matinal-header-row">
          <div>
            <h1>PLAN COMERCIAL</h1>
            <p>Selecciona Matinal o Vespertina</p>
          </div>

          {role === "admin" && (
            <div className="matinal-header-actions" ref={menuRef}>
              <button
                type="button"
                className="matinal-actions-btn"
                onClick={() => setShowUploadMenu((prev) => !prev)}
                aria-label="Opciones de carga"
              >
                <MoreHorizontal size={18} />
              </button>
              {showUploadMenu && (
                <div className="matinal-actions-panel">
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
          )}
        </div>
      </div>

      <div className="plan-tabs">
        <button
          type="button"
          className={`plan-tab ${activeTab === "matinal" ? "active" : ""}`}
          onClick={() => setActiveTab("matinal")}
        >
          Matinal
        </button>
        <button
          type="button"
          className={`plan-tab ${activeTab === "vespertina" ? "active" : ""}`}
          onClick={() => setActiveTab("vespertina")}
        >
          Vespertina
        </button>
      </div>

      {activeTab === "matinal" ? (
        <MatinalPage hideHeader refreshKey={refreshKey} />
      ) : (
        <VespertinaPage hideHeader refreshKey={refreshKey} />
      )}
    </div>
  );
}
