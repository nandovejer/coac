import { Fragment, useEffect, useState } from "react";
import { RollingNumber } from "../ui/RollingNumber";
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

const plural = (value: number, singular: string, pluralForm: string) =>
  `${value} ${value === 1 ? singular : pluralForm}`;

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
                <RollingNumber value={value} />
              </span>
              <span className="coac-countdown__name">{name}</span>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
