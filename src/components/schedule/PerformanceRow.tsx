import type { PerformanceView } from "../../domain/schedule";
import { ModalidadBadge } from "./ModalidadBadge";
import { PreviousYearLink } from "./PreviousYearLink";
import "./PerformanceRow.css";

/** Una actuación: modalidad, hora estimada o "en directo", ciudad, autor, nombre y año anterior. */
export function PerformanceRow({
  performance: { group, estimatedTime, isLive },
}: {
  performance: PerformanceView;
}) {
  return (
    <article id={group.id} className="coac-performance" data-ranking={group.ranking}>
      <div
        className="coac-performance__meta"
        title="Estimación más o menos teniendo en cuenta actuación más el montaje"
      >
        <ModalidadBadge modalidad={group.modalidad} />
        <span className={isLive ? "coac-performance__status--live" : undefined}>
          {isLive ? "📡EN DIRECTO" : `${estimatedTime} aprox.`}
        </span>
        <span className="coac-performance__city">{group.ciudad}</span>
      </div>
      <div className="coac-performance__body">
        <strong className="coac-performance__author">{group.autor}</strong>
        <p className="coac-performance__name">{group.nombre}</p>

        <PreviousYearLink previous={group.previous} />
      </div>
    </article>
  );
}
