const API_URL = "https://backend-nuevo.montesagus2001.workers.dev";

export async function getPlanComercialSheets({ token }) {
  const res = await fetch(`${API_URL}/plan-comercial/sheets`, {
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

export async function getPlanComercialData({ sheet, token }) {
  const res = await fetch(
    `${API_URL}/plan-comercial/data?sheet=${encodeURIComponent(sheet)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "No autorizado");
  }

  return res.json();
}

export async function uploadPlanComercialExcel({ file, token }) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/plan-comercial/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Error subiendo Plan Comercial");
  }

  return data;
}
