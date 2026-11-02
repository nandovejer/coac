import sessionData from "../data/COAC_2026_FINAL.json";
import { loadSessions } from "../domain/loadSessions";
import type { RawSessions, ScheduleConfig } from "../types";
import { SITE } from "./site";

/**
 * Único punto de actualización al pasar de fase o de temporada.
 * Las fechas de cada sesión NO se declaran aquí: se derivan de las claves
 * del propio JSON de datos (`sessionData`).
 */
export const SEASON = {
  year: 2026,
  // Clave usada en el JSON para la agrupación del año anterior (p.ej. "2025").
  previousYear: 2025,
  phaseTitle: "Gran final de adultos",
  liveUrl: "https://www.youtube.com/@ONDACADIZCARNAVAL/streams",
  // Las sesiones empiezan a esta hora y se consideran del día anterior hasta
  // sessionEndTime de la madrugada siguiente (ver utils/handleDate).
  sessionStartTime: "20:00",
  // La final se alarga hasta ~07:00-08:00, mucho más que una sesión normal.
  sessionEndTime: "09:00",
  // Duración estimada de actuación + montaje. En la final las actuaciones son
  // más largas: 15 agrupaciones desde las 20:00 acaban en torno a las 07:15.
  minutesPerGroup: 45,
} as const;

// JSON de la fase tal cual (lo valida `validateSessions` en el build).
export const rawSessions = sessionData as RawSessions;

export const sessions = loadSessions(rawSessions, SEASON);

export const scheduleConfig: ScheduleConfig = {
  sessionStartTime: SEASON.sessionStartTime,
  sessionEndTime: SEASON.sessionEndTime,
  minutesPerGroup: SEASON.minutesPerGroup,
  timeZone: SITE.timeZone,
};
