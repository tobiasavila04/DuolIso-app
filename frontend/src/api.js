// Cliente del backend FastAPI. En desarrollo, Vite proxea /api -> :8000.
// En producción, VITE_API_URL apunta a donde quede deployado el backend
// (nunca hardcodeado acá: así el mismo build sirve para cualquier entorno).
const BASE = import.meta.env.VITE_API_URL || "";
const TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function req(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(BASE + path, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...options,
    });
  } catch (e) {
    if (e.name === "AbortError") {
      throw new ApiError("El servidor tardó demasiado en responder.", 0);
    }
    throw new ApiError("No se pudo conectar con el servidor.", 0);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // FastAPI/Pydantic manda errores de validación como lista de objetos
    // ({detail: [{msg: "..."}]}); el resto, como string simple.
    const detail = Array.isArray(body.detail)
      ? body.detail.map((d) => d.msg).join(" — ")
      : body.detail || `Error ${res.status}`;
    throw new ApiError(detail, res.status);
  }
  return res.json();
}

const MAX_RESPUESTA = 500;

export const api = {
  estado: () => req("/api/estado"),
  metaComun: () => req("/api/meta-comun"),
  procedimientos: () => req("/api/procedimientos"),
  completar: (leccionId, respuesta) => {
    const limpia = (respuesta || "").trim().slice(0, MAX_RESPUESTA);
    return req(`/api/lecciones/${leccionId}/completar`, {
      method: "POST",
      body: JSON.stringify({ respuesta: limpia }),
    });
  },
};

export { MAX_RESPUESTA };
