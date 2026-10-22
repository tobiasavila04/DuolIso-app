import { useEffect, useState } from "react";
import { api } from "../api";

// Pensado para la reunión de coordinadores. A propósito, todo acá es
// agregado — nunca aparece una persona ni un sector señalado individualmente,
// porque el TP es explícito en que así se involucra a la dirección "sin
// exigirle todavía ningún compromiso", no se la usa para controlar a nadie.
const COLOR_NIVEL = ["#d64545", "#ff9600", "#ffc800", "#1cb0f6", "#58cc02"];

export default function DireccionScreen() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.direccion().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="errbox">No se pudo cargar el panel: {error}</div>;
  if (!data) return <div className="loading">Cargando panel…</div>;

  const totalProc = data.niveles.reduce((a, n) => a + n.cantidad, 0) || 1;
  const metaPct = Math.min(100, Math.round((data.logrado_total / data.meta_trimestral) * 100));

  return (
    <section className="screen">
      <div className="ligahead">
        <div>
          <h2>Panel de dirección</h2>
          <p>
            Lo mismo que se muestra en la reunión de coordinadores: nada de esto identifica a una persona ni compara
            sectores entre sí — es la foto completa del sistema, no una herramienta de control.
          </p>
        </div>
      </div>

      <div className="dgrid">
        <div className="dstat">
          <b>{metaPct}%</b>
          <span>de la meta trimestral compartida</span>
        </div>
        <div className="dstat">
          <b>{data.participacion_hoy_pct}%</b>
          <span>participación de hoy en la lección diaria</span>
        </div>
      </div>

      <div className="niveles-card">
        <h3>Procedimientos por nivel</h3>
        <div className="niveles-bar" role="img" aria-label="Distribución de procedimientos por nivel de madurez">
          {data.niveles.map((n, i) => (
            <div
              key={n.nivel}
              className="niveles-seg"
              style={{ width: `${(n.cantidad / totalProc) * 100}%`, background: COLOR_NIVEL[i] }}
              title={`${n.nombre}: ${n.cantidad}`}
            />
          ))}
        </div>
        <div className="niveles-leyenda">
          {data.niveles.map((n, i) => (
            <div className="niveles-item" key={n.nivel}>
              <i style={{ background: COLOR_NIVEL[i] }} />
              {n.nombre} <b>{n.cantidad}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="logros-card">
        <h3>Certificados recientemente</h3>
        {data.logros_recientes.map((l, i) => (
          <div className="logro-row" key={i}>
            <div className="logro-ic">✓</div>
            <div className="logro-txt">
              <b>{l.procedimiento}</b>
              <span>
                {l.sector} · vía {l.como} · {l.cuando}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="fuego">
        <h3>🔥 Próxima prueba de fuego: {data.proxima_prueba_de_fuego}</h3>
        <p>La ceremonia mensual que certifica un procedimiento al último nivel. No la hace la app: la hacen las personas.</p>
      </div>
    </section>
  );
}
