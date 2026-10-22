const TABS = [
  { id: "camino", label: "Camino", d: "M12 3v18M12 3l-6 6M12 3l6 6M6 15l6 6 6-6" },
  {
    id: "liga",
    label: "Liga",
    d: "M8 21h8M12 17v4M6 4h12l-1 7a5 5 0 0 1-10 0Z M6 6H3v2a3 3 0 0 0 3 3 M18 6h3v2a3 3 0 0 1-3 3",
  },
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
              <path d={t.d} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
