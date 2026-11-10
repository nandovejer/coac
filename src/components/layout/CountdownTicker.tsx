import { useEffect, useState } from "react";
import "./CountdownTicker.css";

interface CountdownTickerProps {
  /** Qué sesión es, p. ej. «Próxima sesión · Viernes 8 de enero · 20:00». */
  label: string;
  /** Inicio de la sesión (ISO). */
  targetDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function timeLeft(targetDate: string): TimeLeft | null {
  const ms = +new Date(targetDate) - Date.now();
  if (ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (value: number) => String(value).padStart(2, "0");
const plural = (value: number, one: string, many: string) => `${value} ${value === 1 ? one : many}`;

/**
 * Cuenta atrás en una línea, como la marquesina de un teatro: el texto pasa
 * de derecha a izquierda. Se pausa al tocarla (es un botón) o al pasar el
 * ratón, y queda quieta con «reducir movimiento». El texto que se mueve es
 * decorativo; el lector de pantalla lee uno fijo que solo cambia por minutos.
 */
export function CountdownTicker({ label, targetDate }: CountdownTickerProps) {
  const [left, setLeft] = useState(() => timeLeft(targetDate));
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setLeft(timeLeft(targetDate)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!left) return null;

  const { days, hours, minutes, seconds } = left;
  const text = `${label} · Faltan ${days} d ${pad(hours)} h ${pad(minutes)} min ${pad(seconds)} s`;
  const spoken =
    `${label}. Faltan ${plural(days, "día", "días")}, ${plural(hours, "hora", "horas")} ` +
    `y ${plural(minutes, "minuto", "minutos")}.`;

  return (
    <button
      type="button"
      className="coac-ticker"
      data-paused={paused || undefined}
      aria-pressed={paused}
      onClick={() => setPaused((p) => !p)}
    >
      <span className="coac-sr-only">
        {spoken} {paused ? "Marquesina en pausa." : "Pulsa para pausar la marquesina."}
      </span>
      <span className="coac-ticker__viewport" aria-hidden="true">
        <span className="coac-ticker__track">
          <span className="coac-ticker__item">{text}</span>
          <span className="coac-ticker__item">{text}</span>
        </span>
      </span>
    </button>
  );
}
