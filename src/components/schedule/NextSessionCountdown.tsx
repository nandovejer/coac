import { useEffect, useState } from "react";
import { brandGradientClass } from "../../styles";

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
    <div className="flex flex-col justify-center items-center bg-gray-800 py-6">
      {label && (
        <p
          className={`mb-3 text-sm md:text-base font-medium bg-clip-text text-transparent ${brandGradientClass}`}
        >
          {label}
        </p>
      )}
      <div className="grid grid-flow-col gap-4 md:gap-6 text-center auto-cols-max">
        {units.map(([value, name]) => (
          <div key={name} className="flex flex-col p-3 bg-gray-700 rounded-lg text-white">
            <span className="font-mono text-3xl md:text-5xl">{value}</span>
            <span className="text-xs md:text-sm">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
