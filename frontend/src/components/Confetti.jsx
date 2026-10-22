import { useEffect, useState } from "react";

const COLORS = ["#58cc02", "#1cb0f6", "#ffc800", "#ff9600", "#ce82ff", "#ff4b4b"];

export default function Confetti({ onDone }) {
  const [pieces] = useState(() =>
    Array.from({ length: 70 }, (_, k) => ({
      id: k,
      left: Math.random() * 100,
      color: COLORS[k % COLORS.length],
      duration: 1.6 + Math.random() * 1.2,
      delay: Math.random() * 0.4,
      rotate: Math.random() * 360,
    }))
  );

  useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="confetti">
      {pieces.map((p) => (
        <i
          key={p.id}
          style={{
            left: p.left + "vw",
            background: p.color,
            animationDuration: p.duration + "s",
            animationDelay: p.delay + "s",
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
