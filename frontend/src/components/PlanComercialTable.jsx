import { useMemo } from "react";
import "../pages/css/planComercialPage.css";

function formatValue(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return value.toString();
}

export default function PlanComercialTable({ data }) {
  const headers = useMemo(() => {
    if (!data?.length) return [];
    const firstRow = data[0]?.row_json || {};
    return Object.keys(firstRow);
  }, [data]);

  if (!data?.length) {
    return <p className="plan-empty">No hay Plan Comercial para mostrar</p>;
  }

  return (
    <div className="plan-table-wrapper">
      <table className="plan-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const rowData = row.row_json || {};
            return (
              <tr key={row.id || JSON.stringify(rowData)}>
                {headers.map((h) => (
                  <td key={h}>{formatValue(rowData[h])}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
