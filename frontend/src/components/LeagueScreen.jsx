import { useEffect, useState } from "react";
import { api } from "../api";

const AV_COLORS = ["#1cb0f6", "#ce82ff", "#58cc02", "#ff9600", "#ff4b4b"];

export default function LeagueScreen() {
  const [tabla, setTabla] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.liga().then(setTabla).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="errbox">No se pudo cargar la liga: {error}</div>;
  if (!tabla) return <div className="loading">Cargando liga…</div>;

  return (
    <section className="screen">
      <div className="ligahead">
        <div>
          <h2>Liga Esmeralda</h2>
          <p>Semana del 19 al 23 de octubre</p>
        </div>
      </div>

      {tabla.map((l, i) => (
        <div
          key={l.s}
          className={"row" + (l.me ? " me" : "") + (i < 2 ? " promo" : "") + (i === tabla.length - 1 ? " cae" : "")}
        >
          <div className={"pos" + (i === 0 ? " top" : "")}>{i + 1}</div>
          <div className="avatar" style={{ background: AV_COLORS[i % AV_COLORS.length] }}>
            {l.s.slice(0, 2).toUpperCase()}
          </div>
          <div className="rowname">
            <b>
              {l.s}
              {l.me ? " (vos)" : ""}
            </b>
            <span>racha de {l.r} días</span>
          </div>
          <div className="rowxp">{l.xp} XP</div>
        </div>
      ))}

      <div className="zonelbl up">suben de liga (arriba)</div>
      <div className="zonelbl">bajan de liga (último)</div>

      <div className="fuego">
        <h3>🔥 Próxima prueba de fuego: jueves 30</h3>
        <p>
          Se sortea un procedimiento y alguien de otro sector tiene que ejecutarlo sin preguntarle nada a nadie. Si
          sale, el procedimiento sube al último nivel. Si no sale, vuelve a borrador. Esta parte no la hace la app:
          la hacen las personas, en persona.
        </p>
      </div>
    </section>
  );
}
