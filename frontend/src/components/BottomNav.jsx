// El ícono de "Meta" es un blanco/objetivo, a propósito distinto de un trofeo
// — acá no se compite, se avanza en conjunto hacia el mismo número.
const TABS = [
  { id: "camino", label: "Camino", d: "M12 3v18M12 3l-6 6M12 3l6 6M6 15l6 6 6-6" },
  { id: "meta", label: "Meta", d: "", target: true },
  { id: "direccion", label: "Dirección", d: "M4 21V10l8-6 8 6v11M9 21v-6h6v6", briefcase: true },
  { id: "perfil", label: "Perfil", d: "M4 20c0-4 3.6-6 8-6s8 2 8 6", circle: true },
];

export default function BottomNav({ screen, onChange }) {
  return (
    <nav className="navbar">
      <div className="navin">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={"navbtn" + (screen === t.id ? " active" : "")}
            onClick={() => onChange(t.id)}
            aria-current={screen === t.id}
          >
            <svg viewBox="0 0 24 24">
              {t.circle && <circle cx="12" cy="8" r="4" />}
              {t.target && (
                <>
                  <circle cx="12" cy="12" r="8" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
                </>
              )}
              {t.d && <path d={t.d} />}
            </svg>
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
