import Mascot from "./Mascot";

const XS = [0, -1, 1, 0, -1, 1, 0, -1, 1, 0, -1, 1];
const ROW_W = 260;
const ROW_H = 100;
const X_PX = { "-1": 40, "0": ROW_W / 2, "1": ROW_W - 40 };

function NodeIcon({ state }) {
  if (state === "done")
    return (
      <svg viewBox="0 0 24 24">
        <path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (state === "locked")
    return (
      <svg viewBox="0 0 24 24">
        <rect x="6" y="10" width="12" height="9" rx="2" fill="currentColor" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2.3" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24">
      <path d="M8 5l12 7-12 7Z" fill="currentColor" />
    </svg>
  );
}

function UnitBanner({ unidad }) {
  return (
    <div className="unit" style={{ background: unidad.color }}>
      <div className="ic">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        </svg>
      </div>
      <div>
        <b>Unidad {unidad.id + 1}</b>
        <span>{unidad.nombre}</span>
      </div>
    </div>
  );
}

// El "sendero" punteado que conecta los nodos de una unidad, como el camino
// de Duolingo. Sin esto los círculos quedan flotando sueltos y la pantalla
// se siente vacía — con una curva suave detrás, se lee como un recorrido.
function Sendero({ nodos, color }) {
  const h = nodos.length * ROW_H;
  const pts = nodos.map((n, i) => ({ x: X_PX[n.x], y: i * ROW_H + ROW_H / 2 }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const midY = (prev.y + cur.y) / 2;
    d += ` C ${prev.x} ${midY}, ${cur.x} ${midY}, ${cur.x} ${cur.y}`;
  }
  return (
    <svg className="sendero" viewBox={`0 0 ${ROW_W} ${h}`} width={ROW_W} height={h} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray="1 20" opacity="0.4" />
    </svg>
  );
}

function saludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buen día";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function PathScreen({ estado, onOpenLesson, onGoMeta }) {
  const { unidades, lecciones, completadas, actual, racha, xp } = estado;
  const leccionActual = lecciones.find((l) => l.id === actual);
  const yaHechaHoy = leccionActual ? completadas.includes(leccionActual.id) : completadas.length === lecciones.length;

  // agrupa lecciones por unidad, conservando el zigzag global para que el
  // patrón de izquierda/centro/derecha no se repita siempre igual
  const grupos = [];
  let curUnit = null;
  lecciones.forEach((l, idx) => {
    const x = XS[idx % XS.length];
    const st = completadas.includes(l.id) ? "done" : l.id === actual ? "current" : "locked";
    const nodo = { leccion: l, state: st, x };
    if (l.u !== curUnit) {
      curUnit = l.u;
      grupos.push({ unidad: unidades[l.u], nodos: [nodo] });
    } else {
      grupos[grupos.length - 1].nodos.push(nodo);
    }
  });

  return (
    <section>
      <div className="topbar">
        <div className="topin">
          <div className="wordmark" aria-hidden="true">
            Duol<span>ISO</span>
          </div>
          <div className="chip flame">
            <svg viewBox="0 0 24 24">
              <path
                d="M13.5 1.5c.6 3.2-.9 5-2.4 6.6C9.4 9.9 7.8 11.6 7.8 14.4a6.2 6.2 0 0 0 12.4 0c0-3.4-2-5.4-3.5-7.3-1-1.3-1.8-2.5-1.8-3.9 0-.6.1-1.1.2-1.7-.5.1-1 .1-1.6 0ZM9.4 15.9c0-2 1.3-3.1 2.4-4.1.6 1.9 2.6 2.7 2.6 4.6a2.5 2.5 0 0 1-5 0Z"
                fill="currentColor"
              />
            </svg>
            <span>{racha}</span>
          </div>
          <div className="chip gem">
            <svg viewBox="0 0 24 24">
              <path d="M12 2 2 9l10 13L22 9Z" fill="currentColor" />
            </svg>
            <span>{xp}</span>
          </div>
        </div>
      </div>

      <div className="screen">
        <div className="hero-greet">
          <div className="hg-top">
            <div>
              <div className="hg-eyebrow">DuolISO · Mesa de Ayuda</div>
              <h1>{saludo()}, equipo</h1>
            </div>
            <div className="hg-mascot">
              <Mascot mood={yaHechaHoy ? "guino" : "pensando"} />
            </div>
          </div>
          <p className="hg-sub">
            {yaHechaHoy
              ? `Ya cumpliste hoy. Llevás ${racha} día${racha === 1 ? "" : "s"} seguidos — no la cortes.`
              : leccionActual
              ? `Tenés 1 procedimiento esperando para hoy: "${leccionActual.o}".`
              : "Completaste todo lo disponible. Volvé mañana por más."}
          </p>
          {!yaHechaHoy && leccionActual && (
            <button className="hg-cta" onClick={() => onOpenLesson(leccionActual)}>
              Empezar ahora
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          )}
        </div>

        <div className="path">
          {grupos.map((g, gi) => (
            <div className="chain" key={"g" + gi}>
              <UnitBanner unidad={g.unidad} />
              <div className="chain-nodos" style={{ height: g.nodos.length * ROW_H }}>
                <Sendero nodos={g.nodos} color={g.unidad.color} />
                {g.nodos.map((n, i) => (
                  <div className={`node-pos x-${n.x}`} style={{ top: i * ROW_H }} key={n.leccion.id}>
                    {n.state === "current" && <span className="startbadge">EMPEZAR</span>}
                    <button
                      className={"node " + n.state}
                      onClick={() => n.state !== "locked" && onOpenLesson(n.leccion)}
                      aria-label={n.leccion.o}
                    >
                      {n.state === "current" && <span className="ring" />}
                      <NodeIcon state={n.state} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="node-row x-0">
            <button className="chest" onClick={onGoMeta} aria-label="Ver la meta común del trimestre">
              <svg viewBox="0 0 24 24">
                <path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
                <path d="M2 7h20v3H2Zm9 3v4m-2-2h4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
