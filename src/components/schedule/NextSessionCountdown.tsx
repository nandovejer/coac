import { useEffect, useState } from "react";
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

/** Cuenta atrás a la próxima sesión; desaparece al llegar a cero. */
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
      <div className="coac-countdown__units">
        {units.map(([value, name]) => (
          <div key={name} className="coac-countdown__unit">
            <span className="coac-countdown__value">{value}</span>
            <span className="coac-countdown__name">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
