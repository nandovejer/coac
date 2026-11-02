import { rankingRowClass } from "../../styles";
import type { PerformanceView } from "../../domain/schedule";
import { ModalidadBadge } from "./ModalidadBadge";
import { PreviousYearLink } from "./PreviousYearLink";

/** Una actuación: modalidad, hora estimada o "en directo", ciudad, autor, nombre y año anterior. */
export function PerformanceRow({
  performance: { group, estimatedTime, isLive },
}: {
  performance: PerformanceView;
}) {
  const onAirClass = isLive ? " bg-pink-50 font-bold text-pink-700 blinking" : " text-xs";

  return (
    <article id={group.id} className={`flex flex-auto ${rankingRowClass[group.ranking]}`}>
      <div className="px-4 py-2 pr-0 ">
        <div
          title="Estimación más o menos teniendo en cuenta actuación más el montaje"
          className="flex flex-col justify-center h-full text-xs"
        >
          <ModalidadBadge modalidad={group.modalidad} />
          <span className={onAirClass}> {isLive ? "📡EN DIRECTO" : `${estimatedTime} aprox.`}</span>
          <span className="py-2 text-ellipsis overflow-hidden">{group.ciudad}</span>
        </div>
      </div>
      <div className="px-4 py-4">
        <strong className="text-2xl capitalize text-ellipsis overflow-hidden text-pretty">
          {group.autor}
        </strong>
        <p className="text-xl">{group.nombre}</p>

        <PreviousYearLink previous={group.previous} />
      </div>
    </article>
  );
}
