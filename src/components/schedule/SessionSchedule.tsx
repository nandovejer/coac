import type { Schedule, SessionView } from "../../domain/schedule";
import { Heading } from "../ui/Heading";
import { SessionLineup } from "./SessionLineup";
import "./SessionSchedule.css";

interface SessionScheduleProps {
  schedule: Schedule;
  previousYear: number;
}

/**
 * Reparte las sesiones en hoy / próximas / pasadas (las pasadas, de la más
 * reciente a la más antigua). Se despliegan la de hoy y la siguiente; si la
 * fase ya terminó, la última. El resto, plegadas.
 */
export function SessionSchedule({ schedule: { present, future, past }, previousYear }: SessionScheduleProps) {
  const focus = present ?? future[0] ?? past.at(-1);
  const isOpen = (session: SessionView) => session === focus || (present !== null && session === future[0]);
  const lineup = (session: SessionView) => (
    <SessionLineup
      key={session.date}
      session={session}
      previousYear={previousYear}
      defaultOpen={isOpen(session)}
    />
  );

  return (
    <div className="coac-schedule">
      {present && (
        <section id="session-present" className="coac-schedule__section">
          <Heading className="coac-schedule__title">Sesión de hoy</Heading>
          {lineup(present)}
        </section>
      )}
      {future.length > 0 && (
        <section id="session-future" className="coac-schedule__section">
          <Heading className="coac-schedule__title">Próximas sesiones</Heading>
          {future.map(lineup)}
        </section>
      )}
      {past.length > 0 && (
        <section id="session-past" className="coac-schedule__section">
          <Heading className="coac-schedule__title">Sesiones pasadas</Heading>
          {[...past].reverse().map(lineup)}
        </section>
      )}
    </div>
  );
}
