// src/components/CncTable.jsx

export default function CncTable({ data }) {
  if (data.length === 0) {
    return <p>No hay CNC para mostrar</p>;
  }

  return (
    <table border="1" cellPadding="8" style={{ marginTop: 16 }}>
      <thead>
        <tr>
          <th>Código</th>
          <th>Cliente</th>
          <th>Promotor</th>
          <th>Canal</th>
          <th>Días</th>
        </tr>
      </thead>
      <tbody>
        {data.map((c) => (
          <tr key={c.id}>
            <td>{c.codigo}</td>
            <td>{c.cliente}</td>
            <td>{c.promotor_nombre}</td>
            <td>{c.canal}</td>
            <td>{c.dias.join(", ")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
