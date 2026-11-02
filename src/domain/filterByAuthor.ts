import { sortSessionDates } from "../lib/dates";
import type { Group, SessionsData } from "../types";

export interface AuthorMatch {
  date: string;
  group: Group;
}

/** Agrupaciones cuyo autor contiene `term` (sin distinguir mayúsculas), por orden de sesión. */
export function filterByAuthor(sessions: SessionsData, term: string): AuthorMatch[] {
  const needle = term.toLowerCase();

  return sortSessionDates(Object.keys(sessions)).flatMap((date) =>
    sessions[date]
      .filter((group) => group.autor.toLowerCase().includes(needle))
      .map((group) => ({ date, group })),
  );
}
