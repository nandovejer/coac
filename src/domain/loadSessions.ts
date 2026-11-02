import { NEW_GROUP_LABEL } from "../types";
import type {
  Group,
  Modalidad,
  PreviousGroup,
  RankingKey,
  RawGroup,
  RawSessions,
  SessionsData,
} from "../types";
import { createGroupIdGenerator } from "./ids";

interface LoadOptions {
  year: number;
  previousYear: number;
}

function toPreviousGroup(value: string | undefined, year: number): PreviousGroup | null {
  if (!value) return null;
  return value === NEW_GROUP_LABEL ? { year, isNew: true } : { year, name: value };
}

/**
 * Convierte el JSON de una fase en datos tipados y añade a cada agrupación un
 * `id` estable (para enlazar a su fila con anclas `#id`). No pierde ningún
 * campo: la clave dinámica del año anterior pasa a `previous`.
 *
 * Asume datos ya validados (ver `validateSessions`).
 */
export function loadSessions(raw: RawSessions, { year, previousYear }: LoadOptions): SessionsData {
  const nextId = createGroupIdGenerator(year);
  const sessions: SessionsData = {};

  for (const [date, groups] of Object.entries(raw)) {
    sessions[date] = groups.map((group: RawGroup): Group => ({
      ranking: group.ranking as RankingKey,
      modalidad: group.modalidad as Modalidad,
      nombre: group.nombre,
      autor: group.autor,
      ciudad: group.ciudad,
      id: nextId(group),
      previous: toPreviousGroup(group[String(previousYear)], previousYear),
    }));
  }

  return sessions;
}
