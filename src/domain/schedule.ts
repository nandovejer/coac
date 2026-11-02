import {
  addDays,
  formatMinutesOfDay,
  formatSessionDate,
  getZonedParts,
  parseSessionDate,
  parseTime,
  sessionDateKey,
  sortSessionDates,
  zonedTimeToInstant,
} from "../lib/dates";
import type { Group, ScheduleConfig, SessionStatus, SessionsData } from "../types";

export interface PerformanceView {
  group: Group;
  /** Hora estimada de actuación (`HH:mm`). */
  estimatedTime: string;
  /** `true` si es la agrupación que probablemente está cantando ahora. */
  isLive: boolean;
}

export interface SessionView {
  date: string;
  status: SessionStatus;
  startsAt: Date;
  performances: PerformanceView[];
}

export interface Schedule {
  /** Fecha (`dd/mm/yyyy`) de la sesión "activa" ahora mismo. */
  activeSessionDate: string;
  past: SessionView[];
  present: SessionView | null;
  future: SessionView[];
  /** Primera sesión futura, para la cuenta atrás. */
  nextSession: SessionView | null;
}

/**
 * Fecha (dd/mm/yyyy) de la sesión "activa" en `now`.
 *
 * Las sesiones se consideran parte del día anterior hasta `sessionEndTime` de
 * la madrugada siguiente (p.ej. una sesión del 30/01 que se alarga hasta las
 * 3am del 31/01 se sigue mostrando como "hoy" hasta las 9am).
 */
export function getActiveSessionDate(now: Date, sessionEndTime: string, timeZone: string): string {
  const parts = getZonedParts(now, timeZone);
  const [endHour, endMinute] = parseTime(sessionEndTime);
  const beforeCutoff = parts.hour * 60 + parts.minute < endHour * 60 + endMinute;

  return formatSessionDate(beforeCutoff ? addDays(parts, -1) : parts);
}

/** Instante en que empieza la sesión de la fecha dada (hora de `timeZone`). */
export function getSessionStart(date: string, sessionStartTime: string, timeZone: string): Date {
  const calendarDate = parseSessionDate(date);
  if (!calendarDate) throw new Error(`Fecha de sesión inválida: ${date}`);

  const [hour, minute] = parseTime(sessionStartTime);
  return zonedTimeToInstant(calendarDate, hour, minute, timeZone);
}

/**
 * Hora estimada de actuación de la agrupación en la posición `index` de la
 * sesión, contando desde `sessionStartTime` y sumando `minutesPerGroup` por
 * cada agrupación anterior (actuación + montaje).
 */
export function estimateGroupTime(sessionStartTime: string, index: number, minutesPerGroup: number): string {
  const [startHour, startMinute] = parseTime(sessionStartTime);
  return formatMinutesOfDay(startHour * 60 + startMinute + index * minutesPerGroup);
}

/**
 * Índice de la agrupación que probablemente está actuando en `now`, o `null`
 * si la sesión (que empezó en `sessionStart`) no ha empezado o ya terminó.
 */
export function getLiveGroupIndex(
  now: Date,
  sessionStart: Date,
  minutesPerGroup: number,
  groupCount: number,
): number | null {
  const elapsedMinutes = (now.getTime() - sessionStart.getTime()) / 60000;
  const index = Math.floor(elapsedMinutes / minutesPerGroup);

  return index < 0 || index >= groupCount ? null : index;
}

/**
 * Todo lo que la UI necesita saber de las sesiones en el instante `now`:
 * clasificación en pasadas / hoy / futuras (siempre por orden de fecha), hora
 * estimada de cada agrupación y cuál está en directo.
 */
export function buildSchedule(sessions: SessionsData, now: Date, config: ScheduleConfig): Schedule {
  const { sessionStartTime, sessionEndTime, minutesPerGroup, timeZone } = config;
  const activeSessionDate = getActiveSessionDate(now, sessionEndTime, timeZone);
  const activeKey = sessionDateKey(activeSessionDate);

  const past: SessionView[] = [];
  const future: SessionView[] = [];
  let present: SessionView | null = null;

  for (const date of sortSessionDates(Object.keys(sessions))) {
    const groups = sessions[date];
    const key = sessionDateKey(date);
    const status: SessionStatus = key === activeKey ? "present" : key < activeKey ? "past" : "future";
    const startsAt = getSessionStart(date, sessionStartTime, timeZone);
    const liveIndex =
      status === "present" ? getLiveGroupIndex(now, startsAt, minutesPerGroup, groups.length) : null;

    const view: SessionView = {
      date,
      status,
      startsAt,
      performances: groups.map((group, index) => ({
        group,
        estimatedTime: estimateGroupTime(sessionStartTime, index, minutesPerGroup),
        isLive: index === liveIndex,
      })),
    };

    if (status === "present") present = view;
    else if (status === "past") past.push(view);
    else future.push(view);
  }

  return { activeSessionDate, past, present, future, nextSession: future[0] ?? null };
}
