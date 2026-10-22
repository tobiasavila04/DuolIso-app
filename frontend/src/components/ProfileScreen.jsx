import { useEffect, useState } from "react";
import { api } from "../api";

// "Tu impacto" responde directo al hallazgo 1 del TP: el beneficio de
// sostener el sistema son problemas que no pasaron, y eso no se ve solo. Acá
// se lo mostramos a la persona en números concretos, no como una promesa
// abstracta de "esto sirve".
function TarjetaImpacto({ impacto }) {
  if (!impacto) return <div className="loading" style={{ padding: "24px 0" }}>Cargando tu impacto…</div>;
  return (
    <div className="impacto-card">
      <h3>Tu impacto</h3>
      <p className="impacto-sub">Lo que hiciste y que, si no lo hubieras escrito, nadie vería.</p>
      <div className="impacto-grid">
        <div className="impacto-item">
          <b>{impacto.procedimientos_tuyos}</b>
          <span>procedimientos con tu firma</span>
        </div>
        <div className="impacto-item">
          <b>{impacto.veces_usados_por_otros}</b>
          <span>veces que otra persona los usó</span>
        </div>
        <div className="impacto-item">
          <b>~{impacto.horas_ahorradas_estimadas} h</b>
          <span>estimadas sin tener que preguntarte a vos</span>
        </div>
      </div>
    </div>
  );
}

const MEDALLAS = [
  {
    id: "racha7",
    nombre: "7 días seguidos",
    color: "#ffc800",
    icon: "M8 12.5l2.5 2.5L16 9",
    cumple: (e) => e.racha >= 7,
  },
  {
    id: "racha30",
    nombre: "Un mes de racha",
    color: "#ff9600",
    icon: "M12 4v16M6 10l6-6 6 6",
    cumple: (e) => e.racha >= 30,
  },
  {
    id: "nivel5",
    nombre: "Primer nivel 5",
    color: "#58cc02",
    icon: "M12 6v12M6 12h12",
    cumple: (e, impacto) => (impacto?.nivel_maximo_alcanzado || 0) >= 5,
  },
  {
    id: "tresfirmas",
    nombre: "3 procedimientos propios",
    color: "#1cb0f6",
    icon: "M7 15l3-6 2 3 2-4 3 7",
    cumple: (e, impacto) => (impacto?.procedimientos_tuyos || 0) >= 3,
  },
  {
    id: "meta",
    nombre: "Meta trimestral cumplida",
    color: "#ce82ff",
    icon: "M12 8v4l3 3",
    cumple: (e, impacto, meta) => meta && meta.logrado_total >= meta.meta_trimestral,
  },
  {
    id: "fuego",
    nombre: "Superó una prueba de fuego",
    color: "#ff4b4b",
    icon: "M12 2c1 4-2 5-2 8a3 3 0 0 0 6 0c0-1.5-1-2.5-1.5-3.5",
    cumple: () => false,
  },
];

export default function ProfileScreen({ estado }) {
  const [impacto, setImpacto] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.impacto(), api.metaComun()])
      .then(([i, m]) => {
        setImpacto(i);
        setMeta(m);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <section className="screen">
      <div className="pcard">
        <div className="who">
          <div className="av">MA</div>
          <div>
            <h2>Mesa de Ayuda</h2>
            <div className="sub">Miembro desde marzo · Defensoría del Pueblo CABA</div>
          </div>
        </div>
      </div>

      <div className="statgrid">
        <div className="stat">
          <b>{estado.racha}</b>
          <span>racha actual (días)</span>
        </div>
        <div className="stat">
          <b>{impacto ? Math.max(impacto.racha_mas_larga, estado.racha) : "—"}</b>
          <span>racha más larga</span>
        </div>
        <div className="stat">
          <b>{estado.xp}</b>
          <span>XP totales</span>
        </div>
        <div className="stat">
          <b>{impacto?.nivel_maximo_alcanzado === 5 ? "Sí" : "Todavía no"}</b>
          <span>algún procedimiento tuyo a prueba de ausencias</span>
        </div>
      </div>

      {error ? <div className="errbox">No se pudo cargar tu impacto: {error}</div> : <TarjetaImpacto impacto={impacto} />}

      <div className="medsec">
        <h3>Medallas</h3>
        <div className="meds" style={{ marginLeft: "-18px", marginRight: "-18px", paddingLeft: 18, paddingRight: 18 }}>
          {MEDALLAS.map((m) => {
            const on = m.cumple(estado, impacto, meta);
            return (
              <div className={"med" + (on ? "" : " off")} key={m.id}>
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill={on ? m.color : "#afafaf"} />
                  <path d={m.icon} stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <b>{m.nombre}</b>
              </div>
            );
          })}
        </div>
      </div>

      <div className="foot">
        Prototipo con datos de ejemplo — Trabajo Práctico de Design Thinking · Sistemas de Información IV · UNLu
      </div>
    </section>
  );
}
