export const MODALIDADES = ["CORO", "COMPARSA", "CHIRIGOTA", "CUARTETO"] as const;
export type Modalidad = (typeof MODALIDADES)[number];

export const RANKINGS = ["top", "ok", "standar"] as const;
export type RankingKey = (typeof RANKINGS)[number];

// Texto del JSON para una agrupación sin participación el año anterior.
export const NEW_GROUP_LABEL = "Nueva agrupación";

/** Agrupación del año anterior; `null` si el JSON no trae el dato. */
export type PreviousGroup = { year: number; name: string } | { year: number; isNew: true };

export interface Group {
  ranking: RankingKey;
  modalidad: Modalidad;
  nombre: string;
  autor: string;
  ciudad: string;
  // Ancla estable de la fila (la usa el buscador de autores).
  id: string;
  previous: PreviousGroup | null;
}

/** Sesiones por fecha (`dd/mm/yyyy`), ya tipadas por `loadSessions`. */
export type SessionsData = Record<string, Group[]>;

/** Registro tal cual viene en `src/data/COAC_<año>_<FASE>.json`. */
export interface RawGroup {
  ranking: string;
  modalidad: string;
  nombre: string;
  autor: string;
  ciudad: string;
  // Clave dinámica con el nombre de la agrupación el año anterior, p.ej. "2025".
  [previousYearKey: string]: string;
}

export type RawSessions = Record<string, RawGroup[]>;

export type SessionStatus = "past" | "present" | "future";

/** Lo que necesita `domain/schedule.ts` de la temporada (ver `config/season.ts`). */
export interface ScheduleConfig {
  sessionStartTime: string;
  sessionEndTime: string;
  minutesPerGroup: number;
  timeZone: string;
}
