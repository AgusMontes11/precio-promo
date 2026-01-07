import "../pages/css/cncPage.css"

export default function CncTable({ data, role }) {
  if (!data.length) {
    return <p className="cnc-empty">No hay CNC para mostrar</p>;
  }

  return (
    <div className="cnc-table-wrapper">
      <table className="cnc-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Cliente</th>

            {role === "admin" && <th>Promotor</th>}
            {role === "admin" && <th>Canal</th>}

            <th>Días</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td className="cnc-code">{row.codigo}</td>
              <td>{row.cliente}</td>

              {role === "admin" && (
                <td className="cnc-promotor">
                  {row.promotor_nombre}
                </td>
              )}

               {role === "admin" && (
                <td className="cnc-canal">
                  {row.canal}
                </td>
              )}
              
              <td className="cnc-dias">
                {Array.isArray(row.dias)
                  ? row.dias.join(", ")
                  : row.dias}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
