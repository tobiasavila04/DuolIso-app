import { useState } from "react";
import { useEstado } from "./hooks/useEstado";
import PathScreen from "./components/PathScreen";
import LessonOverlay from "./components/LessonOverlay";
import TeamGoalScreen from "./components/TeamGoalScreen";
import ProfileScreen from "./components/ProfileScreen";
import DireccionScreen from "./components/DireccionScreen";
import BottomNav from "./components/BottomNav";
import Confetti from "./components/Confetti";

export default function App() {
  const { estado, cargando, error, recargar } = useEstado();
  const [screen, setScreen] = useState("camino");
  const [leccionAbierta, setLeccionAbierta] = useState(null);
  const [mostrarConfetti, setMostrarConfetti] = useState(false);

  if (error)
    return (
      <div className="errbox">
        No se pudo conectar con el backend ({error}).{" "}
        <button className="btn3d green" style={{ marginTop: 10 }} onClick={recargar}>
          Reintentar
        </button>
      </div>
    );
  if (cargando || !estado) return <div className="loading">Cargando DuolISO…</div>;

  return (
    <div className="shell">
      {screen === "camino" && (
        <PathScreen estado={estado} onOpenLesson={setLeccionAbierta} onGoMeta={() => setScreen("meta")} />
      )}
      {screen === "meta" && <TeamGoalScreen />}
      {screen === "direccion" && <DireccionScreen />}
      {screen === "perfil" && <ProfileScreen estado={estado} />}

      <BottomNav screen={screen} onChange={setScreen} />

      {leccionAbierta && (
        <LessonOverlay
          leccion={leccionAbierta}
          onClose={() => setLeccionAbierta(null)}
          onCompleted={() => {
            setLeccionAbierta(null);
            recargar();
            setMostrarConfetti(true);
          }}
        />
      )}
      {mostrarConfetti && <Confetti onDone={() => setMostrarConfetti(false)} />}
    </div>
  );
}
