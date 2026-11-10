import type { Schedule, SessionView } from "../../domain/schedule";
import { formatShortDate } from "../../lib/dates";
import { ScrollRow } from "../ui/ScrollRow";
import "./SessionIndex.css";

/** Índice de sesiones de la fase (hoy · próximas · pasadas) con enlace a cada una. */
export function SessionIndex({ schedule: { present, future, past } }: { schedule: Schedule }) {
  const groups: Array<[label: string, sessions: SessionView[]]> = [
    ["Hoy", present ? [present] : []],
    ["Próximas", future],
    ["Pasadas", past],
  ];

  return (
    <nav aria-label="Sesiones de la fase" className="coac-session-index">
      {groups
        .filter(([, sessions]) => sessions.length > 0)
        .map(([label, sessions]) => (
          <div key={label} className="coac-session-index__group">
            <p className="coac-session-index__label">{label}</p>
            <ScrollRow>
              <ul className="coac-session-index__list">
                {sessions.map((session) => {
                  const isLive = session.performances.some((p) => p.isLive);
                  return (
                    <li key={session.date}>
                      <a
                        className="coac-session-index__link"
                        href={`#${session.date}`}
                        data-status={session.status}
                        title={`Sesión del ${session.date}`}
                      >
                        <span className="coac-session-index__day">{formatShortDate(session.date)}</span>
                        {isLive && (
                          <span className="coac-session-index__live">
                            <span className="coac-sr-only">en directo</span>
                          </span>
                        )}
                        <span className="coac-session-index__count">
                          {session.performances.length}
                          <span className="coac-sr-only"> agrupaciones</span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </ScrollRow>
          </div>
        ))}
    </nav>
  );
}
