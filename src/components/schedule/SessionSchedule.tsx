import type { Schedule } from "../../domain/schedule";
import { GradientHeading } from "../ui/GradientHeading";
import { SessionLineup } from "./SessionLineup";
import "./SessionSchedule.css";

const sectionTitleClass = "coac-schedule__title";

/** Reparte las sesiones en hoy / próximas / pasadas. */
export function SessionSchedule({ schedule: { present, future, past } }: { schedule: Schedule }) {
  const onlyPastSessions = present === null && future.length === 0;

  return (
    <div className="coac-schedule">
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
          <GradientHeading as="summary" className={`${sectionTitleClass} coac-schedule__title--past`}>
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
