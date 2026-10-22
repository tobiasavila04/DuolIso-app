import { useCallback, useEffect, useState } from "react";
import { api } from "../api";

// Centraliza el estado global de la app (racha, xp, lecciones, qué está
// cargando, qué falló) en un solo lugar, en vez de repetir fetch/loading/error
// en cada pantalla. Las pantallas solo consumen lo que les sirve.
export function useEstado() {
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(() => {
    setCargando(true);
    setError(null);
    return api
      .estado()
      .then(setEstado)
      .catch((e) => setError(e.message || "No se pudo cargar el estado."))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { estado, cargando, error, recargar };
}
