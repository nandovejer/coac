import type { RankingKey } from "../../types";
import "./RankingPilot.css";

const LABELS: Record<Exclude<RankingKey, "standar">, string> = {
  top: "Imprescindible",
  ok: "Recomendada",
};

/**
 * Piloto del semáforo: la señal del ranking que no depende del color. Círculo
 * lleno para imprescindible, medio círculo para recomendada, y el texto. Las
 * agrupaciones sin ranking no llevan piloto.
 */
export function RankingPilot({ ranking }: { ranking: RankingKey }) {
  if (ranking === "standar") return null;

  return (
    <span className="coac-pilot" data-ranking={ranking}>
      <svg className="coac-pilot__light" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        {ranking === "top" ? (
          <circle cx="6" cy="6" r="5" fill="currentColor" />
        ) : (
          <>
            <circle cx="6" cy="6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M6 1.6a4.4 4.4 0 0 0 0 8.8Z" fill="currentColor" />
          </>
        )}
      </svg>
      {LABELS[ranking]}
    </span>
  );
}
