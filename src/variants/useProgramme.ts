import { useEffect, useMemo, useState } from "react";
import { scheduleConfig, sessions } from "../config/season";
import { searchGroups } from "../domain/filterByAuthor";
import { buildSchedule, type PerformanceView, type SessionView } from "../domain/schedule";
import { useNow } from "../hooks/useNow";
import { addDays, formatSessionDate, parseSessionDate } from "../lib/dates";
import type { Modalidad } from "../types";

/** Un bloque del programa: una sesión (entera o solo las filas que coinciden con la búsqueda). */
export interface ProgrammeSection {
  key: string;
  /** «Hoy», «Mañana» o vacío. */
  label: string;
  session: SessionView;
  performances: PerformanceView[];
}

export type ProgrammeMode = "focus" | "day" | "search";

/**
 * Estado común de los prototipos (variantes A, B y C): el programa de hoy y
 * mañana por defecto, un día elegido en el calendario, o los resultados del
 * buscador (por autor o agrupación, con filtro de modalidad).
 */
export function useProgramme() {
  const now = useNow();
  const schedule = useMemo(() => buildSchedule(sessions, now, scheduleConfig), [now]);
  const [term, setTerm] = useState("");
  const [modalidad, setModalidad] = useState<Modalidad | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const all = useMemo(
    () => [...schedule.past, ...(schedule.present ? [schedule.present] : []), ...schedule.future],
    [schedule],
  );

  const dayLabel = useMemo(() => {
    const today = schedule.activeSessionDate;
    const parsed = parseSessionDate(today);
    const tomorrow = parsed ? formatSessionDate(addDays(parsed, 1)) : "";
    return (date: string) => (date === today ? "Hoy" : date === tomorrow ? "Mañana" : "");
  }, [schedule.activeSessionDate]);

  const searching = term.trim() !== "" || modalidad !== null;

  const { mode, sections } = useMemo((): { mode: ProgrammeMode; sections: ProgrammeSection[] } => {
    const whole = (session: SessionView): ProgrammeSection => ({
      key: session.date,
      label: dayLabel(session.date),
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

    // Hoy y mañana; antes de empezar, las dos primeras; acabada la fase, la última.
    const focus = schedule.present
      ? [schedule.present, ...schedule.future.slice(0, 1)]
      : schedule.future.length > 0
        ? schedule.future.slice(0, 2)
        : schedule.past.slice(-1);
    return { mode: "focus", sections: focus.map(whole) };
  }, [all, dayLabel, modalidad, schedule, searching, selectedDate, term]);

  return {
    schedule,
    all,
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
    /** Vuelve a «hoy y mañana»: sin búsqueda ni día elegido. */
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
