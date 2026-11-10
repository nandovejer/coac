import type { MouseEvent } from "react";
import type { PerformanceView } from "../../domain/schedule";
import { formatSessionTitleDate } from "../../lib/dates";
import { ModalidadBadge } from "../schedule/ModalidadBadge";
import { PreviousYearLink } from "../schedule/PreviousYearLink";
import { RankingPilot } from "../schedule/RankingPilot";
import { BroadcastIcon } from "../ui/icons";
import "./SearchResultCard.css";

interface SearchResultCardProps {
  /** Fecha `dd/mm/yyyy` de la sesión en la que canta. */
  date: string;
  performance: PerformanceView;
  /** Se pulsa la tarjeta: el buscador cierra el modal y lleva a la fila. */
  onSelect: (id: string, event: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Tarjeta de un resultado del buscador con los mismos datos que la fila del
 * programa: sesión y hora estimada (o «en directo»), semáforo, autor,
 * agrupación, modalidad, localidad y año anterior. El enlace al programa cubre
 * toda la tarjeta; el del vídeo del año anterior va por encima.
 */
export function SearchResultCard({
  date,
  performance: { group, estimatedTime, isLive },
  onSelect,
}: SearchResultCardProps) {
  return (
    <article className="coac-result" data-ranking={group.ranking}>
      <p className="coac-result__when">
        <span>{formatSessionTitleDate(date)}</span>
        {isLive ? (
          <span className="coac-result__live">
            <BroadcastIcon inline /> EN DIRECTO
          </span>
        ) : (
          <span className="coac-result__time">{estimatedTime} aprox.</span>
        )}
      </p>
      <RankingPilot ranking={group.ranking} />
      <a className="coac-result__link" href={`#${group.id}`} onClick={(event) => onSelect(group.id, event)}>
        <strong className="coac-result__author">{group.autor}</strong>
        <span className="coac-sr-only"> (ir a su fila en el programa)</span>
      </a>
      <p className="coac-result__name">{group.nombre}</p>
      <div className="coac-result__meta">
        <ModalidadBadge modalidad={group.modalidad} />
        <span className="coac-result__city">{group.ciudad}</span>
      </div>
      <div className="coac-result__previous">
        <PreviousYearLink previous={group.previous} />
      </div>
    </article>
  );
}
