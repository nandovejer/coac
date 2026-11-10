import type { SessionView } from "../../domain/schedule";
import { ModalidadBadge } from "./ModalidadBadge";
import "./LiveStatus.css";

/**
 * Resumen de la agrupación que está cantando: en qué puesto va, quién es y
 * quién sale después. No pinta nada si la sesión de hoy no está en directo.
 */
export function LiveStatus({ session }: { session: SessionView }) {
  const index = session.performances.findIndex((p) => p.isLive);
  if (index < 0) return null;

  const { group } = session.performances[index];
  const next = session.performances[index + 1];

  return (
    <section className="coac-live-status" aria-label="Ahora mismo en el Falla">
      <p className="coac-live-status__label">
        <span className="coac-live-status__badge">📡EN DIRECTO</span> {index + 1} de{" "}
        {session.performances.length}
      </p>
      <a className="coac-live-status__author" href={`#${group.id}`}>
        {group.autor}
      </a>
      <p className="coac-live-status__name">
        <ModalidadBadge modalidad={group.modalidad} /> {group.nombre}
      </p>
      {next ? (
        <p className="coac-live-status__next">
          Después, sobre las {next.estimatedTime}:{" "}
          <a className="coac-live-status__next-link" href={`#${next.group.id}`}>
            {next.group.autor}
          </a>
        </p>
      ) : (
        <p className="coac-live-status__next">Es la última agrupación de la sesión.</p>
      )}
    </section>
  );
}
