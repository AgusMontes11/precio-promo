const API_URL = "https://backend-nuevo.montesagus2001.workers.dev";

export async function getCncData({ sheet, token }) {
  const res = await fetch(
    `${API_URL}/cnc/data?sheet=${encodeURIComponent(sheet)}`,
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
