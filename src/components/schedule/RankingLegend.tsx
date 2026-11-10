import "./RankingLegend.css";

/** Qué significan los colores de las filas y de dónde salen las horas. */
export function RankingLegend({ minutesPerGroup }: { minutesPerGroup: number }) {
  return (
    <div className="coac-legend">
      <ul className="coac-legend__list">
        <li className="coac-legend__item">
          <span className="coac-legend__swatch" data-ranking="top" aria-hidden="true" />
          Imprescindible
        </li>
        <li className="coac-legend__item">
          <span className="coac-legend__swatch" data-ranking="ok" aria-hidden="true" />
          Recomendada
        </li>
      </ul>
      <p className="coac-legend__note">
        Horas estimadas: {minutesPerGroup} min por agrupación (actuación y montaje).
      </p>
    </div>
  );
}
