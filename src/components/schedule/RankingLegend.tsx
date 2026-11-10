import { RankingPilot } from "./RankingPilot";
import "./RankingLegend.css";

interface RankingLegendProps {
  minutesPerGroup: number;
  /** "side": en el panel lateral de escritorio; "main": sobre las sesiones, en móvil. */
  placement: "side" | "main";
}

/** Qué significan los pilotos de las filas y de dónde salen las horas. */
export function RankingLegend({ minutesPerGroup, placement }: RankingLegendProps) {
  return (
    <div className="coac-legend" data-placement={placement}>
      <p className="coac-legend__pilots">
        <RankingPilot ranking="top" />
        <RankingPilot ranking="ok" />
      </p>
      <p className="coac-legend__note">
        Horas estimadas: {minutesPerGroup} min por agrupación (actuación y montaje).
      </p>
    </div>
  );
}
