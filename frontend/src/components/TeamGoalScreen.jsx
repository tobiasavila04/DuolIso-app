import { useEffect, useState } from "react";
import { api } from "../api";

// A propósito, esta pantalla NO es un ranking. El TP es explícito en este
// punto: "en lugar de un ranking que exponga a los equipos [...] cada sector
// se compara con su propio historial". Por eso acá no hay posiciones, no hay
// orden por puntaje, y cada sector se mide únicamente contra su propio
// trimestre anterior — nunca contra los demás sectores.
const COLORS = ["#1cb0f6", "#ce82ff", "#ff9600", "#58cc02"];

function Tendencia({ actual, anterior }) {
  if (actual > anterior) return <span className="tend tend-up">▲ mejoró vs. el trimestre pasado</span>;
  if (actual < anterior) return <span className="tend tend-down">▼ bajó vs. el trimestre pasado</span>;
  return <span className="tend">= igual que el trimestre pasado</span>;
}

export default function TeamGoalScreen() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.metaComun().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="errbox">No se pudo cargar la meta común: {error}</div>;
  if (!data) return <div className="loading">Cargando meta común…</div>;

  const pct = Math.min(100, Math.round((data.logrado_total / data.meta_trimestral) * 100));

  return (
    <section className="screen">
      <div className="ligahead">
        <div>
          <h2>Meta común del trimestre</h2>
          <p>
            Todos los sectores suman al mismo objetivo: procedimientos que llegaron a "a prueba de ausencias". No
            compiten entre sí — cada uno se compara con su propio historial.
          </p>
        </div>
      </div>

      <div className="metabar-card">
        <div className="metabar-top">
          <b className="num">{data.logrado_total}</b>
          <span>de {data.meta_trimestral} procedimientos a prueba de ausencias</span>
        </div>
        <div className="metabar-track">
          <div className="metabar-fill" style={{ width: pct + "%" }} />
        </div>
        <div className="metabar-pct">{pct}% del objetivo del trimestre</div>
      </div>

      {data.sectores.map((s, i) => (
        <div key={s.s} className={"row" + (s.me ? " me" : "")}>
          <div className="avatar" style={{ background: COLORS[i % COLORS.length] }}>
            {s.s.slice(0, 2).toUpperCase()}
          </div>
          <div className="rowname">
            <b>
              {s.s}
              {s.me ? " (vos)" : ""}
            </b>
            <Tendencia actual={s.logrado} anterior={s.trimestre_anterior} />
          </div>
          <div className="rowxp">{s.logrado}</div>
        </div>
      ))}

      <div className="fuego">
        <h3>🔥 Próxima prueba de fuego: jueves 30</h3>
        <p>
          Se sortea un procedimiento y alguien de otro sector tiene que ejecutarlo sin preguntarle nada a nadie. Si
          sale, sube al último nivel y suma a la meta común. Si no sale, vuelve a borrador. Un simulacro de ausencia
          también puede certificar un procedimiento de esta forma. Esta parte no la hace la app: la hacen las
          personas, en persona — y lo que queda registrado acá es la prueba que se usa después en el juicio al
          sistema de gestión.
        </p>
      </div>
    </section>
  );
}
