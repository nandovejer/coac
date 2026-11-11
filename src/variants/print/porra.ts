import type { SessionView } from "../../domain/schedule";
import { MODALIDADES, type Group, type Modalidad } from "../../types";
import { PHASES, isHomePhase } from "../phases";
import { capitalize } from "./format";

/**
 * «Modo porra»: una hoja con todas las agrupaciones de la fase para apostar.
 * En preliminares, cuartos y semifinales se marca quién pasa de fase (una
 * casilla por agrupación); en la final, qué premio gana cada una en su
 * modalidad (casillas del 1.º al 4.º). La comparten la hoja, el PDF y la imagen.
 */
export type PorraKind = "pass" | "prizes";

export interface PorraSection {
  modalidad: Modalidad;
  /** «Coros», «Comparsas»… */
  title: string;
  groups: Group[];
}

export interface Porra {
  kind: PorraKind;
  title: string;
  /** Qué hay que hacer en la hoja. */
  howTo: string;
  sections: PorraSection[];
  count: number;
}

export const PRIZES = ["1.º", "2.º", "3.º", "4.º"] as const;

/** A qué fase se pasa desde cada una (con su artículo cuando lo lleva). */
const NEXT_PHASE = { pre: "cuartos", cuartos: "semifinales", semi: "la final" } as const;

const plural = (modalidad: Modalidad) => `${capitalize(modalidad)}s`;

/** Orden alfabético sin fijarse en las comillas o signos del principio. */
const sortKey = (name: string) => name.replace(/^[^\p{L}\p{N}]+/u, "");
const byName = (a: Group, b: Group) =>
  sortKey(a.nombre).localeCompare(sortKey(b.nombre), "es", { sensitivity: "base" });

/** Títulos de modalidad y agrupaciones, en el orden de la hoja «¿quién pasa?». */
export type PorraItem = { type: "heading"; title: string; count: number } | { type: "group"; group: Group };

export const porraItems = (porra: Porra): PorraItem[] =>
  porra.sections.flatMap((section) => [
    { type: "heading" as const, title: section.title, count: section.groups.length },
    ...section.groups.map((group) => ({ type: "group" as const, group })),
  ]);

export function buildPorra(sessions: SessionView[], modalidades: ReadonlySet<Modalidad>): Porra {
  const phase = PHASES.find(isHomePhase);
  const kind: PorraKind = phase?.id === "final" ? "prizes" : "pass";

  const all = sessions.flatMap((session) => session.performances.map(({ group }) => group));
  const sections = MODALIDADES.filter((modalidad) => modalidades.has(modalidad))
    .map((modalidad) => ({
      modalidad,
      title: plural(modalidad),
      groups: all.filter((group) => group.modalidad === modalidad).sort(byName),
    }))
    .filter((section) => section.groups.length > 0);

  const next = phase && phase.id !== "final" ? NEXT_PHASE[phase.id] : "la siguiente fase";
  return {
    kind,
    title: `Porra · ${kind === "prizes" ? "¿Quién gana?" : `¿Quién pasa a ${next}?`}`,
    howTo:
      kind === "prizes"
        ? "En cada modalidad, marca qué premio crees que se lleva cada agrupación, del 1.º al 4.º."
        : "Marca la casilla de las agrupaciones que creas que pasan.",
    sections,
    count: sections.reduce((total, section) => total + section.groups.length, 0),
  };
}
