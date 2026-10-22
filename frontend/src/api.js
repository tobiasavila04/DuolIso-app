// Cliente del backend FastAPI. En desarrollo, Vite proxea /api -> :8000.
// En producción, VITE_API_URL apunta a donde quede deployado el backend.
const BASE = import.meta.env.VITE_API_URL || "";

async function req(path, options) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  estado: () => req("/api/estado"),
  liga: () => req("/api/liga"),
  procedimientos: () => req("/api/procedimientos"),
  completar: (leccionId, respuesta) =>
    req(`/api/lecciones/${leccionId}/completar`, {
      method: "POST",
      body: JSON.stringify({ respuesta }),
    }),
};
