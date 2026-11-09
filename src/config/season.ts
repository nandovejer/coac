import sessionData from "../data/COAC_2027_PRE.json";
import { loadSessions } from "../domain/loadSessions";
import type { RawSessions, ScheduleConfig } from "../types";
import { SITE } from "./site";

/**
 * Único punto de actualización al pasar de fase o de temporada.
 * Las fechas de cada sesión NO se declaran aquí: se derivan de las claves
 * del propio JSON de datos (`sessionData`).
 *
 * Calendario de adultos COAC 2027 (todas las sesiones a las 20:00):
 * - Preliminares: 8 al 21 de enero      → COAC_2027_PRE.json
 * - Cuartos de final: 24 al 29 de enero → plantillas/COAC_2027_CUARTOS.json
 * - Semifinales: 1 al 3 de febrero      → plantillas/COAC_2027_SEMI.json
 * - Gran final: 5 de febrero            → plantillas/COAC_2027_FINAL.json
 * Al llegar cada fase, rellena su plantilla, muévela a `src/data/` y cambia
 * aquí el import y `phaseTitle` ("Cuartos de final de adultos",
 * "Semifinales de adultos", "Gran final de adultos"). En la final de 2026
 * se usó `sessionEndTime: "09:00"` y `minutesPerGroup: 45`.
 */
export const SEASON = {
  year: 2027,
  // Clave usada en el JSON para la agrupación del año anterior (p.ej. "2026").
  previousYear: 2026,
  phaseTitle: "Preliminares de adultos",
  liveUrl: "https://www.youtube.com/@ONDACADIZCARNAVAL/streams",
  // Las sesiones empiezan a esta hora y se consideran del día anterior hasta
  // sessionEndTime de la madrugada siguiente (ver utils/handleDate).
  sessionStartTime: "20:00",
  // Con 10 agrupaciones las sesiones de preliminares acaban sobre las 02:00.
  sessionEndTime: "04:00",
  // Duración estimada de actuación + montaje en preliminares.
  minutesPerGroup: 35,
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
