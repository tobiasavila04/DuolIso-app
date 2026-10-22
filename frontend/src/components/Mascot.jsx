// Mascota "Fiel": un escudito, en línea con la certificación ISO que motiva
// todo el prototipo. Tres estados de ánimo reutilizados en toda la lección.
export default function Mascot({ mood = "pensando" }) {
  const face =
    mood === "feliz" ? (
      <>
        <circle cx="31" cy="33" r="3.4" fill="#2b6600" />
        <circle cx="45" cy="33" r="3.4" fill="#2b6600" />
        <path d="M28 44c4 5 16 5 20 0" stroke="#2b6600" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      </>
    ) : mood === "guino" ? (
      <>
        <path d="M27 30l8 7M35 30l-8 7" stroke="#2b6600" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M41 30l8 7M49 30l-8 7" stroke="#2b6600" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M29 45c4 -4 18 -4 22 0" stroke="#2b6600" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx="31" cy="34" r="3" fill="#2b6600" />
        <circle cx="45" cy="34" r="3" fill="#2b6600" />
        <path d="M30 45h16" stroke="#2b6600" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      </>
    );
  return (
    <svg viewBox="0 0 76 76" width="100%" height="100%">
      <path d="M38 4 68 14v24C68 58 54 68 38 72 22 68 8 58 8 38V14Z" fill="#58cc02" />
      <path d="M38 10 62 18v20C62 54 50 62 38 66 26 62 14 54 14 38V18Z" fill="#79d93f" />
      {face}
    </svg>
  );
}
