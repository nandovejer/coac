import { sortSessionDates } from "../lib/dates";
import type { Group, Modalidad, SessionsData } from "../types";

export interface AuthorMatch {
  date: string;
  group: Group;
  /** Texto del resultado: el autor, con " - MODALIDAD" si el mismo autor sale más de una vez. */
  label: string;
}

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Añade `label` a cada coincidencia. Si el mismo texto de autor sale en varias
 * agrupaciones se le añade " - MODALIDAD" para distinguirlas; si aun así dos
 * coinciden (misma modalidad), se añade también el nombre de la agrupación.
 */
function withLabels(matches: Omit<AuthorMatch, "label">[]): AuthorMatch[] {
  const repeatedAuthor = (m: Omit<AuthorMatch, "label">) =>
    matches.filter((o) => sameText(o.group.autor, m.group.autor)).length > 1;
  const repeatedModalidad = (m: Omit<AuthorMatch, "label">) =>
    matches.filter((o) => sameText(o.group.autor, m.group.autor) && o.group.modalidad === m.group.modalidad)
      .length > 1;

  return matches.map((m) => {
    let label = m.group.autor;
    if (repeatedAuthor(m)) label += ` - ${m.group.modalidad}`;
    if (repeatedModalidad(m)) label += ` - ${m.group.nombre}`;
    return { ...m, label };
  });
}

/** Agrupaciones cuyo autor contiene `term` (sin distinguir mayúsculas), por orden de sesión. */
export function filterByAuthor(sessions: SessionsData, term: string): AuthorMatch[] {
  const needle = term.toLowerCase();

  return withLabels(
    sortSessionDates(Object.keys(sessions)).flatMap((date) =>
      sessions[date]
        .filter((group) => group.autor.toLowerCase().includes(needle))
        .map((group) => ({ date, group })),
    ),
  );
}

/** Minúsculas y sin tildes, para que «cadiz» encuentre «Cádiz». */
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export interface GroupSearch {
  /** Texto a buscar en el autor y en el nombre de la agrupación (vacío: todas). */
  term: string;
  /** Solo esa modalidad; `null` para todas. */
  modalidad: Modalidad | null;
}

/**
 * Agrupaciones cuyo autor o nombre contienen `term` (sin distinguir mayúsculas
 * ni tildes) y, si se pide, de una modalidad. Por orden de sesión y de
 * actuación. Sin texto ni modalidad no devuelve nada.
 */
export function searchGroups(
  sessions: SessionsData,
  { term, modalidad }: GroupSearch,
): Array<{ date: string; group: Group }> {
  const needle = normalize(term.trim());
  if (!needle && !modalidad) return [];

  return sortSessionDates(Object.keys(sessions)).flatMap((date) =>
    sessions[date]
      .filter(
        (group) =>
          (!modalidad || group.modalidad === modalidad) &&
          (!needle || normalize(group.autor).includes(needle) || normalize(group.nombre).includes(needle)),
      )
      .map((group) => ({ date, group })),
  );
}
