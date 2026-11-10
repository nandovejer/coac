import type { PerformanceView } from "../../domain/schedule";
import { ModalidadBadge } from "./ModalidadBadge";
import { PreviousYearLink } from "./PreviousYearLink";
import "./PerformanceRow.css";

/**
 * Una actuación como fila del programa: hora estimada (o "en directo"), autor
 * y agrupación, modalidad, ciudad y año anterior. En pantallas estrechas las
 * celdas se apilan.
 */
export function PerformanceRow({
  performance: { group, estimatedTime, isLive },
}: {
  performance: PerformanceView;
}) {
  return (
    <article id={group.id} className="coac-performance" data-ranking={group.ranking}>
      <div
        className="coac-performance__time"
        title="Estimación más o menos teniendo en cuenta actuación más el montaje"
      >
        {isLive ? (
          <span className="coac-performance__status--live">📡EN DIRECTO</span>
        ) : (
          <>
            {estimatedTime} <small className="coac-performance__approx">aprox.</small>
          </>
        )}
      </div>
      <div className="coac-performance__body">
        <strong className="coac-performance__author">{group.autor}</strong>
        <p className="coac-performance__name">{group.nombre}</p>
      </div>
      <div className="coac-performance__modalidad">
        <ModalidadBadge modalidad={group.modalidad} />
      </div>
      <span className="coac-performance__city">{group.ciudad}</span>
      <PreviousYearLink previous={group.previous} />
    </article>
  );
}
