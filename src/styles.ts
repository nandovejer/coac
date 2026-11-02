import type { Modalidad, RankingKey } from "./types";

// Clases Tailwind reutilizadas en varios componentes.
export const activeSessionClass = "shadow-2xl rounded-lg bg-white";
export const brandGradientClass = "bg-gradient-to-r from-blue-500 to-teal-400";

// Color por modalidad, para identificar el tipo de agrupación de un vistazo.
export const modalidadColors: Record<Modalidad, string> = {
  CORO: "bg-indigo-100 text-indigo-800",
  COMPARSA: "bg-emerald-100 text-emerald-800",
  CHIRIGOTA: "bg-amber-100 text-amber-800",
  CUARTETO: "bg-rose-100 text-rose-800",
};

// Resaltado de la fila según el ranking de la agrupación.
export const rankingRowClass: Record<RankingKey, string> = {
  top: "bg-rose-700 text-rose-50",
  ok: "bg-amber-300 text-amber-700",
  standar: "bg-orange-50",
};
