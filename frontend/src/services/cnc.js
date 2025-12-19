// src/api/cnc.js

const API_URL = import.meta.env.VITE_API_URL;
// ejemplo: https://backend-nuevo.montesagus2001.workers.dev

export async function getCncData({ sheet, token }) {
  const res = await fetch(
    `${API_URL}/cnc/data?sheet=${encodeURIComponent(sheet)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error obteniendo CNC");
  }

  return res.json();
}
