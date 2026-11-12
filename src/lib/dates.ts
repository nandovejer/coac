/**
 * Utilidades de fecha y hora. Las sesiones se identifican por fecha
 * `dd/mm/yyyy` y las horas son "de pared" en una zona horaria concreta (la de
 * Cádiz), así que no dependen de la zona del navegador ni de la del build.
 */

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

const SESSION_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const pad = (value: number) => String(value).padStart(2, "0");

/** Parsea `dd/mm/yyyy`; `null` si el formato o la fecha no son válidos. */
export function parseSessionDate(value: string): CalendarDate | null {
  const match = SESSION_DATE_PATTERN.exec(value);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  const isReal =
    check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day;

  return isReal ? { year, month, day } : null;
}

export function formatSessionDate({ year, month, day }: CalendarDate): string {
  return `${pad(day)}/${pad(month)}/${year}`;
}

export function addDays({ year, month, day }: CalendarDate, days: number): CalendarDate {
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/** Número comparable (`yyyymmdd`) de una fecha `dd/mm/yyyy`. */
export function sessionDateKey(value: string): number {
  const date = parseSessionDate(value);
  return date ? date.year * 10000 + date.month * 100 + date.day : Number.POSITIVE_INFINITY;
}

export function sortSessionDates(dates: string[]): string[] {
  return [...dates].sort((a, b) => sessionDateKey(a) - sessionDateKey(b));
}

export function parseTime(time: string): [hour: number, minute: number] {
  const [hour, minute] = time.split(":").map(Number);
  return [hour, minute];
}

/** Minutos desde las 00:00 → `HH:mm` (da la vuelta pasadas las 24 h). */
export function formatMinutesOfDay(totalMinutes: number): string {
  const minutesInDay = 24 * 60;
  const normalized = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
}

export interface ZonedParts extends CalendarDate {
  hour: number;
  minute: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Fecha y hora "de pared" que marca el reloj de `timeZone` en el instante dado. */
export function getZonedParts(instant: Date, timeZone: string): ZonedParts {
  const values: Record<string, number> = {};
  for (const part of getFormatter(timeZone).formatToParts(instant)) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  };
}

function zoneOffsetMs(instantMs: number, timeZone: string): number {
  const minuteMs = Math.floor(instantMs / 60000) * 60000;
  const parts = getZonedParts(new Date(minuteMs), timeZone);
  const wallClockAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return wallClockAsUtc - minuteMs;
}

/** Instante absoluto en el que el reloj de `timeZone` marca esa fecha y hora. */
export function zonedTimeToInstant(
  { year, month, day }: CalendarDate,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  // Dos pasadas: la primera estima el desfase y la segunda lo corrige si
  // cruzamos un cambio de horario.
  const firstGuess = wallClockAsUtc - zoneOffsetMs(wallClockAsUtc, timeZone);
  return new Date(wallClockAsUtc - zoneOffsetMs(firstGuess, timeZone));
}

/**
 * Instante en hora de pared de `timeZone` con su desfase, a minuto exacto
 * (ISO 8601): `2027-01-08T20:00:00+01:00`. Es lo que piden los datos
 * estructurados; `toISOString()` daría la hora en UTC.
 */
export function formatZonedIso(instant: Date, timeZone: string): string {
  const parts = getZonedParts(instant, timeZone);
  const offsetMinutes = Math.round(zoneOffsetMs(instant.getTime(), timeZone) / 60000);
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);
  return (
    `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:00` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

/** `dd/mm/yyyy` → `yyyy-mm-dd` (el `datetime` de un `<time>`); el texto original si no es válida. */
export function sessionIsoDate(value: string): string {
  const date = parseSessionDate(value);
  return date ? `${date.year}-${pad(date.month)}-${pad(date.day)}` : value;
}

/** `dd/mm/yyyy` → "jueves, 23 de enero de 2025". */
export function formatLongDate(value: string): string {
  const date = parseSessionDate(value);
  if (!date) return value;

  return new Date(Date.UTC(date.year, date.month - 1, date.day, 12)).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** `dd/mm/yyyy` → "Jueves 21 de enero" (título de sesión; el año ya está en la cabecera). */
export function formatSessionTitleDate(value: string): string {
  const date = parseSessionDate(value);
  if (!date) return value;

  const text = new Date(Date.UTC(date.year, date.month - 1, date.day, 12)).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return text.replace(",", "").replace(/^./, (c) => c.toUpperCase());
}

/** `dd/mm/yyyy` → "sáb 9" (para índices y listas cortas). */
export function formatShortDate(value: string): string {
  const date = parseSessionDate(value);
  if (!date) return value;

  const weekday = new Date(Date.UTC(date.year, date.month - 1, date.day, 12))
    .toLocaleDateString("es-ES", { weekday: "short", timeZone: "UTC" })
    .replace(".", "");
  return `${weekday} ${date.day}`;
}
