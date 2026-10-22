export default function ProfileScreen({ estado }) {
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
          <b>19</b>
          <span>racha más larga</span>
        </div>
        <div className="stat">
          <b>{estado.xp}</b>
          <span>XP totales</span>
        </div>
        <div className="stat">
          <b>3</b>
          <span>procedimientos a prueba de ausencias</span>
        </div>
      </div>
      <div className="medsec">
        <h3>Medallas</h3>
        <div className="meds">
          <div className="med">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="#ffc800" />
              <path d="M8 12.5l2.5 2.5L16 9" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <b>7 días seguidos</b>
          </div>
          <div className="med">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="#58cc02" />
              <path d="M12 6v12M6 12h12" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            <b>Primer nivel 5</b>
          </div>
          <div className="med off">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="#afafaf" />
              <path d="M7 15l3-6 2 3 2-4 3 7" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <b>1° en la liga</b>
          </div>
        </div>
      </div>
      <div className="foot">
        Prototipo con datos de ejemplo — Trabajo Práctico de Design Thinking · Sistemas de Información IV · UNLu
      </div>
    </section>
  );
}
