import { useEffect, useState } from "react";
import { RollingNumber } from "../ui/RollingNumber";
import "./CountdownTicker.css";

interface CountdownTickerProps {
  /** Qué sesión es, corto para que quepa en una línea: «Próxima: vie 8 · 20:00». */
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

/** Cifras que ruedan al cambiar, como en la cuenta atrás del hero. */
function Rolling({ value }: { value: number }) {
  return (
    <span className="coac-ticker__digits">
      <RollingNumber value={value} />
    </span>
  );
}

const plural = (value: number, one: string, many: string) => `${value} ${value === 1 ? one : many}`;

/**
 * Cuenta atrás en una tira fina y fija, a todo el ancho de la barra superior.
 * Las cifras ruedan al cambiar. El texto visible cambia cada segundo y va oculto a los lectores de pantalla;
 * ellos leen uno que solo cambia por minutos.
 */
export function CountdownTicker({ label, targetDate }: CountdownTickerProps) {
  const [left, setLeft] = useState(() => timeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => setLeft(timeLeft(targetDate)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!left) return null;

  const { days, hours, minutes, seconds } = left;

  return (
    <p className="coac-ticker">
      <span className="coac-sr-only">
        {label}. Faltan {plural(days, "día", "días")}, {plural(hours, "hora", "horas")} y{" "}
        {plural(minutes, "minuto", "minutos")}.
      </span>
      <span className="coac-ticker__text" aria-hidden="true">
        {label} · Faltan <Rolling value={days} /> d <Rolling value={hours} />:<Rolling value={minutes} />:
        <Rolling value={seconds} />
      </span>
    </p>
  );
}
