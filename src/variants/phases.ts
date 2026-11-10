import { SEASON } from "../config/season";
import { sessionDateKey } from "../lib/dates";

/**
 * Fases del concurso de adultos (calendario de `season.ts`). La fase en curso
 * es la que tiene datos en `season.ts` (`SEASON.phaseTitle`): es la portada.
 * Prototipo: las fases pasadas aún no se pueden abrir (están archivadas en
 * ramas); cuando se pueda, cada una tendrá su `href`.
 */
export interface Phase {
  id: "pre" | "cuartos" | "semi" | "final";
  title: string;
  /** Nombre corto para el pie. */
  short: string;
  /** Primera y última sesión, `dd/mm/yyyy`. */
  from: string;
  to: string;
  /** Texto corto de las fechas. */
  dates: string;
}

export const PHASES: Phase[] = [
  {
    id: "pre",
    title: "Preliminares de adultos",
    short: "Preliminares",
    from: `08/01/${SEASON.year}`,
    to: `21/01/${SEASON.year}`,
    dates: "8 – 21 ene",
  },
  {
    id: "cuartos",
    title: "Cuartos de final de adultos",
    short: "Cuartos",
    from: `24/01/${SEASON.year}`,
    to: `29/01/${SEASON.year}`,
    dates: "24 – 29 ene",
  },
  {
    id: "semi",
    title: "Semifinales de adultos",
    short: "Semifinales",
    from: `01/02/${SEASON.year}`,
    to: `03/02/${SEASON.year}`,
    dates: "1 – 3 feb",
  },
  {
    id: "final",
    title: "Gran final de adultos",
    short: "Final",
    from: `05/02/${SEASON.year}`,
    to: `05/02/${SEASON.year}`,
    dates: "5 feb",
  },
];

export type PhaseStatus = "past" | "present" | "future";

/** Estado por fechas respecto al día de sesión de hoy (de madrugada sigue siendo el de ayer). */
export function phaseStatus(phase: Phase, activeSessionDate: string): PhaseStatus {
  const today = sessionDateKey(activeSessionDate);
  if (today > sessionDateKey(phase.to)) return "past";
  return today >= sessionDateKey(phase.from) ? "present" : "future";
}

/** La fase de la portada: la que tiene datos en `season.ts`. */
export const isHomePhase = (phase: Phase) => phase.title === SEASON.phaseTitle;

export const PHASE_STATUS_LABEL: Record<PhaseStatus, string> = {
  past: "Celebrada",
  present: "En curso",
  future: "Próximamente",
};
