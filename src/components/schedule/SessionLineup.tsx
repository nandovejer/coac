import { memo } from "react";
import type { SessionView } from "../../domain/schedule";
import { formatLongDate } from "../../lib/dates";
import { GradientHeading } from "../ui/GradientHeading";
import { PerformanceRow } from "./PerformanceRow";
import "./SessionLineup.css";

interface SessionLineupProps {
  session: SessionView;
  /** Año de la columna "año anterior". */
  previousYear: number;
  /** Desplegada al cargar (la de hoy y la siguiente); el resto, plegada. */
  defaultOpen: boolean;
}

/** Orden de actuación de una sesión, como tabla plegable. */
function SessionLineupView({
  session: { date, status, performances, estimatedEndTime },
  previousYear,
  defaultOpen,
}: SessionLineupProps) {
  const startTime = performances[0]?.estimatedTime;

  return (
    <details className="coac-session" data-status={status} id={date} open={defaultOpen}>
      <summary className="coac-session__summary">
        <GradientHeading as="h3" className="coac-session__title">
          Sesión - {formatLongDate(date)}
        </GradientHeading>
        <span className="coac-session__meta">
          {performances.length} agrupaciones · {startTime}–{estimatedEndTime} aprox.
        </span>
      </summary>
      <div className="coac-session__scroller">
        <section className="coac-session__lineup" aria-label={`Agrupaciones de la sesión del ${date}`}>
          <div className="coac-session__head" aria-hidden="true">
            <div className="coac-session__head-cell">Hora</div>
            <div className="coac-session__head-cell">Autor y agrupación</div>
            <div className="coac-session__head-cell">Modalidad</div>
            <div className="coac-session__head-cell">Localidad</div>
            <div className="coac-session__head-cell">En {previousYear}</div>
          </div>
          <div className="coac-session__rows">
            {performances.map((performance) => (
              <PerformanceRow key={performance.group.id} performance={performance} />
            ))}
          </div>
        </section>
      </div>
    </details>
  );
}

const liveIndex = (session: SessionView) => session.performances.findIndex((p) => p.isLive);

// buildSchedule crea objetos nuevos en cada refresco de `useNow`; solo hay que
// repintar una sesión si cambia su estado o la agrupación que está en directo.
// `open` solo cambia el atributo cuando cambia `defaultOpen`: lo que despliegue
// o pliegue la persona se respeta entre refrescos.
export const SessionLineup = memo(
  SessionLineupView,
  (prev, next) =>
    prev.session.date === next.session.date &&
    prev.session.status === next.session.status &&
    prev.defaultOpen === next.defaultOpen &&
    prev.previousYear === next.previousYear &&
    liveIndex(prev.session) === liveIndex(next.session),
);
