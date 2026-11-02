import type { Schedule } from "../../domain/schedule";
import { GradientHeading } from "../ui/GradientHeading";
import { NextSessionCountdown } from "./NextSessionCountdown";
import { SessionLineup } from "./SessionLineup";

const sectionTitleClass = "text-2xl md:text-4xl m-4 mt-8 uppercase text-center ";

/** Reparte las sesiones en hoy / próximas / pasadas y muestra la cuenta atrás cuando no hay sesión hoy. */
export function SessionSchedule({
  schedule: { present, future, past, nextSession },
}: {
  schedule: Schedule;
}) {
  const showCountdown = present === null && nextSession !== null;
  const onlyPastSessions = present === null && future.length === 0;

  return (
    <div className="max-w-4xl mx-auto">
      {showCountdown && (
        <NextSessionCountdown
          label={`Próxima sesión: ${nextSession.date}`}
          targetDate={nextSession.startsAt.toISOString()}
        />
      )}
      {present && (
        <div id="session-present">
          <GradientHeading className={sectionTitleClass}>Sesión de Hoy</GradientHeading>
          <SessionLineup session={present} />
        </div>
      )}
      {future.length > 0 && (
        <div id="session-future">
          <GradientHeading className={sectionTitleClass}>Próximas sesiones</GradientHeading>
          {future.map((session) => (
            <SessionLineup key={session.date} session={session} />
          ))}
        </div>
      )}
      {past.length > 0 && (
        // Si la fase ya terminó (no queda sesión de hoy ni futura) abrimos el
        // bloque: si no, la página se vería vacía con todo plegado aquí dentro.
        <details id="session-past" open={onlyPastSessions}>
          <GradientHeading as="summary" className={`${sectionTitleClass}grayscale cursor-pointer`}>
            Sesiones Pasadas
          </GradientHeading>
          {past.map((session) => (
            <SessionLineup key={session.date} session={session} />
          ))}
        </details>
      )}
    </div>
  );
}
