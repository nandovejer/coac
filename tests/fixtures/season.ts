import { SITE } from "../../src/config/site";
import { loadSessions } from "../../src/domain/loadSessions";
import type { RawSessions, ScheduleConfig } from "../../src/types";
import sessionData from "./sessions.json";

/**
 * Sustituye a `src/config/season.ts` en el build "e2e" (ver `vite.config.ts`),
 * igual que `sessions.json` sustituye al JSON de la fase: así las capturas no
 * cambian al pasar de fase. Mismas exportaciones que el original.
 */
export const SEASON = {
  year: 2026,
  previousYear: 2025,
  phaseTitle: "Gran final de adultos",
  liveUrl: "https://www.youtube.com/@ONDACADIZCARNAVAL/streams",
  sessionStartTime: "20:00",
  sessionEndTime: "09:00",
  minutesPerGroup: 45,
} as const;

export const rawSessions = sessionData as RawSessions;

export const sessions = loadSessions(rawSessions, SEASON);

export const scheduleConfig: ScheduleConfig = {
  sessionStartTime: SEASON.sessionStartTime,
  sessionEndTime: SEASON.sessionEndTime,
  minutesPerGroup: SEASON.minutesPerGroup,
  timeZone: SITE.timeZone,
};
