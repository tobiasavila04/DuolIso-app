const XS = [0, -1, 1, 0, -1, 1, 0, -1, 1, 0, -1, 1];

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

export default function PathScreen({ estado, onOpenLesson, onGoLiga }) {
  const { unidades, lecciones, completadas, actual, racha, xp } = estado;
  let curUnit = null;
  const items = [];
  lecciones.forEach((l, idx) => {
    if (l.u !== curUnit) {
      curUnit = l.u;
      items.push({ type: "banner", unidad: unidades[l.u], key: "b" + l.u });
    }
    const st = completadas.includes(l.id) ? "done" : l.id === actual ? "current" : "locked";
    items.push({ type: "node", leccion: l, state: st, x: XS[idx % XS.length], key: "n" + l.id });
  });

  return (
    <section>
      <div className="topbar">
        <div className="topin">
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
        <div className="path">
          {items.map((it) =>
            it.type === "banner" ? (
              <UnitBanner key={it.key} unidad={it.unidad} />
            ) : (
              <div className={`node-row x-${it.x}`} key={it.key}>
                {it.state === "current" && <span className="startbadge">EMPEZAR</span>}
                <button
                  className={"node " + it.state}
                  onClick={() => it.state !== "locked" && onOpenLesson(it.leccion)}
                  aria-label={it.leccion.o}
                >
                  {it.state === "current" && <span className="ring" />}
                  <NodeIcon state={it.state} />
                </button>
              </div>
            )
          )}
          <div className="node-row x-0">
            <button className="chest" onClick={onGoLiga} aria-label="Cofre de la liga">
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
