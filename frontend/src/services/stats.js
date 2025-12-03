import api from "./api";

export async function getStats() {
  const res = await api.get("/stats");
  return res.data;
}
