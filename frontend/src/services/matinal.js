const API_URL = "https://backend-nuevo.montesagus2001.workers.dev";

export async function getMatinalData({ token, promotorId }) {
  const params = new URLSearchParams();
  if (promotorId) params.set("promotorId", promotorId);

  const res = await fetch(`${API_URL}/matinal/data?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "No autorizado");
  }

  return res.json();
}

export async function getMatinalSalesStatus({ token }) {
  const res = await fetch(`${API_URL}/matinal/sales-status`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "No autorizado");
  }

  return res.json();
}

export async function setMatinalSalesStatus({ token, codigo_pdv, sold }) {
  const res = await fetch(`${API_URL}/matinal/sales-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ codigo_pdv, sold }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Error guardando estado");
  }

  return data;
}

export async function uploadMatinalExcel({ file, token }) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/matinal/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Error subiendo Matinal");
  }

  return data;
}
