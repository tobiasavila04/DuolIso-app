import { useState } from "react";
import Mascot from "./Mascot";
import { api } from "../api";

export default function LessonOverlay({ leccion, onClose, onCompleted }) {
  const [step, setStep] = useState(0);
  const [resp, setResp] = useState("");
  const [opIdx, setOpIdx] = useState(-1);
  const [confirmado, setConfirmado] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const dicho = leccion.tipo === "texto" ? resp.trim() : leccion.ops[opIdx];
  const pct = step === 0 ? 10 : step === 1 ? 55 : 100;

  async function confirmar() {
    setEnviando(true);
    setError("");
    try {
      const r = await api.completar(leccion.id, dicho);
      setResultado(r);
      setStep(2);
    } catch (e) {
      setError(e.message || "No se pudo guardar. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="lesson">
      <div className="lhead">
        <button className="lx" onClick={onClose} aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="ltrack">
          <div className="lfill" style={{ width: pct + "%" }} />
        </div>
      </div>

      <div className={"lbody" + (step === 2 ? " center" : "")}>
        {step === 0 && (
          <>
            <div className="origrow">
              <span className="tag">{leccion.o}</span>
              <span className="tag min">{leccion.min} min</span>
            </div>
            <div className="mascot-row">
              <div className="mascot">
                <Mascot mood="pensando" />
              </div>
              <div className="bubble">{leccion.t}</div>
            </div>
            {leccion.tipo === "texto" ? (
              <textarea
                className="resp"
                placeholder="Escribilo como se lo contarías a un compañero."
                value={resp}
                onChange={(e) => setResp(e.target.value)}
              />
            ) : (
              <div className="choices">
                {leccion.ops.map((o, i) => (
                  <button
                    key={i}
                    type="button"
                    className={"choice" + (opIdx === i ? " on" : "")}
                    onClick={() => setOpIdx(i)}
                  >
                    <span className="ico">
                      <svg viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {o}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <div className="mascot-row">
              <div className="mascot">
                <Mascot mood="feliz" />
              </div>
              <div className="bubble">
                Quedó anotado: <i>“{dicho.length > 90 ? dicho.slice(0, 90) + "…" : dicho}”</i>. Una confirmación más y
                es todo tuyo.
              </div>
            </div>
            <div className="choices">
              <button type="button" className={"choice" + (confirmado ? " on" : "")} onClick={() => setConfirmado(true)}>
                <span className="ico">
                  <svg viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Sí, así es como lo hacemos
              </button>
            </div>
            {error && <p style={{ color: "var(--red)", fontWeight: 700, marginTop: 14 }}>{error}</p>}
          </>
        )}

        {step === 2 && resultado && (
          <div className="result">
            <div className="result-ic">
              <Mascot mood="feliz" />
            </div>
            <h2>¡Listo por hoy!</h2>
            <p>{resultado.resultado}</p>
            {resultado.cita && <p className="quote">{resultado.cita}</p>}
            <div className="xpburst">
              <div className="xpcard xp">
                <b>+{resultado.xp_ganado} XP</b>
                <span>Ganados</span>
              </div>
              <div className="xpcard streak">
                <b>{resultado.racha}</b>
                <span>Racha</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="lfoot">
        {step === 0 && (
          <button
            className="btn3d green wide"
            disabled={leccion.tipo === "texto" ? dicho.length < 3 : opIdx < 0}
            onClick={() => setStep(1)}
          >
            Continuar
          </button>
        )}
        {step === 1 && (
          <button className="btn3d green wide" disabled={!confirmado || enviando} onClick={confirmar}>
            {enviando ? "Guardando…" : "Confirmar"}
          </button>
        )}
        {step === 2 && (
          <button className="btn3d green wide" onClick={() => onCompleted(resultado)}>
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
}
