import { memo } from "react";
import type { SessionView } from "../../domain/schedule";
import { activeSessionClass, brandGradientClass } from "../../styles";
import { formatLongDate } from "../../lib/dates";
import { GradientHeading } from "../ui/GradientHeading";
import { PerformanceRow } from "./PerformanceRow";

const statusClass: Record<SessionView["status"], string> = {
  present: activeSessionClass,
  past: "opacity-50 hover:opacity-100 grayscale",
  future: "",
};

/** Orden de actuación de una sesión. */
function SessionLineupView({ session: { date, status, performances } }: { session: SessionView }) {
  return (
    <div className={`px-4 py-4 coac-session mt-8 ${statusClass[status]}`} id={date}>
      <GradientHeading as="h3" className="text-2xl md:text-3xl mb-4">
        Sesión - {formatLongDate(date)}
      </GradientHeading>
      <div className="overflow-x-auto scrollbar scrollbar-thumb-gray-500 scrollbar-track-gray-100 scrollbar-thin scrollbar-thumb-rounded">
        <section
          className="min-w-full divide-y divide-gray-200"
          aria-label={`Agrupaciones de la sesión del ${date}`}
        >
          <div className={`flex flex-auto ${brandGradientClass}`}>
            <div className="px-4 py-3 text-left text-xs font-medium text-white uppercase ">Modalidad</div>
            <div className="px-4 py-3 text-left text-xs font-medium text-white uppercase">
              Nombre de agrupación
            </div>
          </div>
          <div className="divide-y divide-gray-200">
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
