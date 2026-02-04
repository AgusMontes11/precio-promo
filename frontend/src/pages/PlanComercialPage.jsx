import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useAuth } from "../context/useAuth";
import PlanComercialTable from "../components/PlanComercialTable";
import {
  getPlanComercialData,
  getPlanComercialSheets,
  uploadPlanComercialExcel,
} from "../services/planComercial";
import "./css/planComercialPage.css";

function slugify(value = "") {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function PlanComercialPage() {
  const { role } = useAuth();
  const token = localStorage.getItem("token");
  const tableRef = useRef(null);

  const [sheets, setSheets] = useState([]);
  const [sheet, setSheet] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadSheets();
    // eslint-disable-next-line
    }, [token]);

  useEffect(() => {
    if (!token || !sheet) return;
    loadPlan();
    // eslint-disable-next-line
  }, [sheet, token]);

  async function loadSheets() {
    try {
      setLoading(true);
      setError(null);

      const data = await getPlanComercialSheets({ token });
      const nextSheets = data?.sheets || [];
      setSheets(nextSheets);

      if (nextSheets.length && !sheet) {
        setSheet(nextSheets[0]);
      }
    } catch (err) {
      setError(err.message || "Error cargando Plan Comercial");
    } finally {
      setLoading(false);
    }
  }

  async function loadPlan() {
    try {
      setLoading(true);
      setError(null);

      const data = await getPlanComercialData({ sheet, token });
      setRows(data?.rows || []);
    } catch (err) {
      setError(err.message || "Error cargando Plan Comercial");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;

    try {
      setUploadMsg("Subiendo archivo…");
      const data = await uploadPlanComercialExcel({ file, token });
      setUploadMsg(`✔ ${data.rowsInserted} filas cargadas`);
      setFile(null);
      await loadSheets();
      if (sheet) {
        await loadPlan();
      }
    } catch (err) {
      setUploadMsg(`❌ ${err.message}`);
    }
  }

  async function handleDownloadPdf() {
    if (!tableRef.current || !rows.length) return;

    try {
      setDownloading(true);
      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "pt", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const ratio = Math.min(
        pdfWidth / canvas.width,
        pdfHeight / canvas.height
      );

      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;

      const x = (pdfWidth - imgWidth) / 2;
      const y = 20;

      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(`plan-comercial-${slugify(sheet) || "plan"}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="plan-page">
      <div className="plan-header">
        <h1>Plan comercial</h1>
        <p>Datos diarios del plan comercial por usuario</p>
      </div>

      <div className="plan-top-row">
        <div className="plan-tabs">
          {sheets.map((s) => (
            <button
              key={s}
              className={`plan-tab ${sheet === s ? "active" : ""}`}
              onClick={() => setSheet(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="plan-actions">
          <button
            className="plan-btn"
            onClick={handleDownloadPdf}
            disabled={!rows.length || downloading}
          >
            {downloading ? "Generando…" : "Descargar PDF"}
          </button>

          {role === "admin" && (
            <div className="plan-upload">
              <form onSubmit={handleUpload}>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <button type="submit">Subir Excel</button>
              </form>

              {uploadMsg && (
                <span className="plan-upload-msg">{uploadMsg}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="plan-card" ref={tableRef}>
        {loading && <PlanLoader />}
        {error && <p className="plan-error">{error}</p>}

        {!loading && !error && <PlanComercialTable data={rows} />}
      </div>
    </div>
  );
}

function PlanLoader() {
  return (
    <div className="plan-loader">
      <div className="spinner" />
      <span>Cargando Plan Comercial…</span>
    </div>
  );
}
