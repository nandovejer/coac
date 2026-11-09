import { Fragment, useEffect, useState } from "react";
import "./NextSessionCountdown.css";

interface NextSessionCountdownProps {
  targetDate: string;
  label?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const calculateTimeLeft = (targetDate: string): TimeLeft => {
  const difference = +new Date(targetDate) - +new Date();
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

/** Cifras de un número con al menos dos dígitos: 5 → ["0", "5"]. */
const toDigits = (value: number): string[] => String(value).padStart(2, "0").split("");

const plural = (value: number, singular: string, pluralForm: string) =>
  `${value} ${value === 1 ? singular : pluralForm}`;

/**
 * Una cifra del reloj. Al cambiar, la anterior sube y se desvanece mientras la
 * nueva entra desde abajo (la animación está en el CSS y se desactiva con
 * `prefers-reduced-motion`).
 */
function RollingDigit({ value }: { value: string }) {
  const [state, setState] = useState<{ current: string; previous: string | null }>({
    current: value,
    previous: null,
  });
  // Ajuste de estado durante el render: recuerda la cifra que acaba de salir.
  if (state.current !== value) setState({ current: value, previous: state.current });

  return (
    <span className="coac-digit">
      <span
        key={state.current}
        className="coac-digit__current"
        data-rolling={state.previous !== null || undefined}
      >
        {state.current}
      </span>
      {state.previous !== null && (
        <span key={`${state.previous}>${state.current}`} className="coac-digit__previous">
          {state.previous}
        </span>
      )}
    </span>
  );
}

/** Cuenta atrás a la próxima sesión con aspecto de reloj digital; desaparece al llegar a cero. */
export function NextSessionCountdown({ targetDate, label }: NextSessionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const isTimeOver =
    timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isTimeOver) {
    return null;
  }

  const units: Array<[value: number, name: string]> = [
    [timeLeft.days, "días"],
    [timeLeft.hours, "horas"],
    [timeLeft.minutes, "minutos"],
    [timeLeft.seconds, "segundos"],
  ];

  return (
    <div className="coac-countdown">
      {label && <p className="coac-countdown__label">{label}</p>}
      {/* Los dígitos cambian cada segundo: los lectores de pantalla leen este
          texto, que solo cambia por minutos y no se anuncia solo. */}
      <p className="coac-sr-only">
        Faltan {plural(timeLeft.days, "día", "días")}, {plural(timeLeft.hours, "hora", "horas")} y{" "}
        {plural(timeLeft.minutes, "minuto", "minutos")}.
      </p>
      <div className="coac-countdown__units" aria-hidden="true">
        {units.map(([value, name], index) => (
          <Fragment key={name}>
            {index > 0 && <span className="coac-countdown__separator">:</span>}
            <div className="coac-countdown__unit">
              <span className="coac-countdown__value">
                {toDigits(value).map((digit, position, all) => (
                  <RollingDigit key={all.length - position} value={digit} />
                ))}
              </span>
              <span className="coac-countdown__name">{name}</span>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
