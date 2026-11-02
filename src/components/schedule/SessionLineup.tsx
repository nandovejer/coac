import { memo } from "react";
import type { SessionView } from "../../domain/schedule";
import { formatLongDate } from "../../lib/dates";
import { GradientHeading } from "../ui/GradientHeading";
import { PerformanceRow } from "./PerformanceRow";
import "./SessionLineup.css";

/** Orden de actuación de una sesión. */
function SessionLineupView({ session: { date, status, performances } }: { session: SessionView }) {
  return (
    <div className="coac-session" data-status={status} id={date}>
      <GradientHeading as="h3" className="coac-session__title">
        Sesión - {formatLongDate(date)}
      </GradientHeading>
      <div className="coac-session__scroller">
        <section className="coac-session__lineup" aria-label={`Agrupaciones de la sesión del ${date}`}>
          <div className="coac-session__head">
            <div className="coac-session__head-cell">Modalidad</div>
            <div className="coac-session__head-cell">Nombre de agrupación</div>
          </div>
          <div className="coac-session__rows">
            {performances.map((performance) => (
              <PerformanceRow key={performance.group.id} performance={performance} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const liveIndex = (session: SessionView) => session.performances.findIndex((p) => p.isLive);

// buildSchedule crea objetos nuevos en cada refresco de `useNow`; solo hay que
// repintar una sesión si cambia su estado o la agrupación que está en directo.
export const SessionLineup = memo(
  SessionLineupView,
  (prev, next) =>
    prev.session.date === next.session.date &&
    prev.session.status === next.session.status &&
    liveIndex(prev.session) === liveIndex(next.session),
);
