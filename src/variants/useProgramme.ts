import { useEffect, useMemo, useState } from "react";
import { scheduleConfig, sessions } from "../config/season";
import { searchGroups } from "../domain/filterByAuthor";
import { buildSchedule, type PerformanceView, type SessionView } from "../domain/schedule";
import { useNow } from "../hooks/useNow";
import { addDays, formatMinutesOfDay, formatSessionDate, parseSessionDate, parseTime } from "../lib/dates";
import type { Modalidad } from "../types";

/** Un bloque del programa: una sesión (entera o solo las filas que coinciden con la búsqueda). */
export interface ProgrammeSection {
  key: string;
  /** «Hoy», «Mañana», «Celebrada» o vacío. */
  label: string;
  session: SessionView;
  performances: PerformanceView[];
}

export type ProgrammeMode = "focus" | "day" | "search";

/**
 * En qué punto está cada actuación según la hora estimada: ya actuó, está
 * actuando, es la siguiente o queda por llegar.
 */
export type Stage = "done" | "live" | "next" | "pending";

/** Hora estimada (`HH:mm`) más `minutes`. */
export const addMinutes = (time: string, minutes: number) => {
  const [hour, minute] = parseTime(time);
  return formatMinutesOfDay(hour * 60 + minute + minutes);
};

/**
 * Estado común de los prototipos: el programa de hoy y mañana por defecto (con
 * `allSessions`, todas las sesiones: hoy, las próximas y al final las
 * celebradas), un día elegido en el calendario, o los resultados del buscador
 * (por autor o agrupación, con filtro de modalidad).
 */
export function useProgramme({ allSessions = false }: { allSessions?: boolean } = {}) {
  const now = useNow();
  const schedule = useMemo(() => buildSchedule(sessions, now, scheduleConfig), [now]);
  const [term, setTerm] = useState("");
  const [modalidad, setModalidad] = useState<Modalidad | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Hoy, luego las próximas y, al final, las ya celebradas (ver AGENTS.md, «Estados de sesión»).
  const all = useMemo(
    () => [...(schedule.present ? [schedule.present] : []), ...schedule.future, ...schedule.past],
    [schedule],
  );

  const dayLabel = useMemo(() => {
    const today = schedule.activeSessionDate;
    const parsed = parseSessionDate(today);
    const tomorrow = parsed ? formatSessionDate(addDays(parsed, 1)) : "";
    return (session: SessionView) =>
      session.date === today
        ? "Hoy"
        : session.date === tomorrow
          ? "Mañana"
          : session.status === "past"
            ? "Celebrada"
            : "";
  }, [schedule.activeSessionDate]);

  const searching = term.trim() !== "" || modalidad !== null;

  const { mode, sections } = useMemo((): { mode: ProgrammeMode; sections: ProgrammeSection[] } => {
    const whole = (session: SessionView): ProgrammeSection => ({
      key: session.date,
      label: dayLabel(session),
      session,
      performances: session.performances,
    });

    if (searching) {
      const ids = new Set(searchGroups(sessions, { term, modalidad }).map(({ group }) => group.id));
      return {
        mode: "search",
        sections: all
          .map((session) => ({
            ...whole(session),
            performances: session.performances.filter((p) => ids.has(p.group.id)),
          }))
          .filter((section) => section.performances.length > 0),
      };
    }

    const selected = all.find((session) => session.date === selectedDate);
    if (selected) return { mode: "day", sections: [whole(selected)] };

    if (allSessions) return { mode: "focus", sections: all.map(whole) };

    // Hoy y mañana; antes de empezar, las dos primeras; acabada la fase, la última.
    const focus = schedule.present
      ? [schedule.present, ...schedule.future.slice(0, 1)]
      : schedule.future.length > 0
        ? schedule.future.slice(0, 2)
        : schedule.past.slice(-1);
    return { mode: "focus", sections: focus.map(whole) };
  }, [all, allSessions, dayLabel, modalidad, schedule, searching, selectedDate, term]);

  const present = schedule.present;
  const liveIndex = present ? present.performances.findIndex((performance) => performance.isLive) : -1;

  /** Estado de una actuación de `session` (la sesión entera o una fila del buscador). */
  const stageOf = (session: SessionView, performance: PerformanceView): Stage => {
    if (session.status === "past") return "done";
    if (session.status === "future") return "pending";
    // Sesión de hoy sin nadie en directo: o no ha empezado, o ya terminó.
    if (liveIndex === -1) return now >= session.startsAt ? "done" : "pending";
    const index = session.performances.indexOf(performance);
    if (index < liveIndex) return "done";
    if (index === liveIndex) return "live";
    return index === liveIndex + 1 ? "next" : "pending";
  };

  /** Parte transcurrida (0–1) del turno de la agrupación en directo. */
  const liveProgress =
    present && liveIndex >= 0
      ? Math.min(
          1,
          Math.max(
            0,
            ((now.getTime() - present.startsAt.getTime()) / 60000 -
              liveIndex * scheduleConfig.minutesPerGroup) /
              scheduleConfig.minutesPerGroup,
          ),
        )
      : 0;

  return {
    schedule,
    all,
    stageOf,
    liveProgress,
    dayLabel,
    mode,
    sections,
    count: sections.reduce((total, section) => total + section.performances.length, 0),
    live: schedule.present?.performances.find((p) => p.isLive) ?? null,
    term,
    setTerm,
    modalidad,
    setModalidad,
    selectedDate,
    setSelectedDate,
    /** Vuelve al programa por defecto: sin búsqueda ni día elegido. */
    reset: () => {
      setTerm("");
      setModalidad(null);
      setSelectedDate(null);
    },
  };
}

export interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Tiempo que falta hasta `target`, segundo a segundo; `null` si ya pasó o no hay objetivo. */
export function useRemaining(target: Date | null | undefined): Remaining | null {
  const targetMs = target ? target.getTime() : null;
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (targetMs === null) return;
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  if (targetMs === null || targetMs <= nowMs) return null;
  const total = Math.floor((targetMs - nowMs) / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export const pad2 = (value: number) => String(value).padStart(2, "0");
