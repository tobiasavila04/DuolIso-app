import { useEffect, useState } from "react";
import { api } from "./api";
import PathScreen from "./components/PathScreen";
import LessonOverlay from "./components/LessonOverlay";
import LeagueScreen from "./components/LeagueScreen";
import ProfileScreen from "./components/ProfileScreen";
import BottomNav from "./components/BottomNav";
import Confetti from "./components/Confetti";

export default function App() {
  const [estado, setEstado] = useState(null);
  const [error, setError] = useState("");
  const [screen, setScreen] = useState("camino");
  const [leccionAbierta, setLeccionAbierta] = useState(null);
  const [mostrarConfetti, setMostrarConfetti] = useState(false);

  function cargarEstado() {
    api.estado().then(setEstado).catch((e) => setError(e.message));
  }

  useEffect(cargarEstado, []);

  if (error)
    return (
      <div className="errbox">
        No se pudo conectar con el backend ({error}). ¿Está corriendo <code>uvicorn main:app --port 8000</code>?
      </div>
    );
  if (!estado) return <div className="loading">Cargando Racha…</div>;

  return (
    <div className="shell">
      {screen === "camino" && (
        <PathScreen estado={estado} onOpenLesson={setLeccionAbierta} onGoLiga={() => setScreen("liga")} />
      )}
      {screen === "liga" && <LeagueScreen />}
      {screen === "perfil" && <ProfileScreen estado={estado} />}

      <BottomNav screen={screen} onChange={setScreen} />

      {leccionAbierta && (
        <LessonOverlay
          leccion={leccionAbierta}
          onClose={() => setLeccionAbierta(null)}
          onCompleted={() => {
            setLeccionAbierta(null);
            cargarEstado();
            setMostrarConfetti(true);
          }}
        />
      )}
      {mostrarConfetti && <Confetti onDone={() => setMostrarConfetti(false)} />}
    </div>
  );
}
