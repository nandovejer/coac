import { describe, expect, it } from "vitest";
import type { Group, ScheduleConfig, SessionsData } from "../types";
import {
  buildSchedule,
  estimateGroupTime,
  getActiveSessionDate,
  getLiveGroupIndex,
  getSessionStart,
} from "./schedule";

const TZ = "Europe/Madrid";
const config: ScheduleConfig = {
  sessionStartTime: "20:00",
  sessionEndTime: "09:00",
  minutesPerGroup: 45,
  timeZone: TZ,
};

const at = (iso: string) => new Date(iso);

describe("getActiveSessionDate", () => {
  it("de noche es la sesión del propio día", () => {
    expect(getActiveSessionDate(at("2026-02-12T20:10:00+01:00"), "09:00", TZ)).toBe("12/02/2026");
  });

  it("de madrugada sigue siendo la sesión del día anterior", () => {
    expect(getActiveSessionDate(at("2026-02-13T00:30:00+01:00"), "09:00", TZ)).toBe("12/02/2026");
    expect(getActiveSessionDate(at("2026-02-13T08:59:00+01:00"), "09:00", TZ)).toBe("12/02/2026");
  });

  it("a partir de la hora de corte ya es el día nuevo", () => {
    expect(getActiveSessionDate(at("2026-02-13T09:00:00+01:00"), "09:00", TZ)).toBe("13/02/2026");
    expect(getActiveSessionDate(at("2026-02-13T04:00:00+01:00"), "04:00", TZ)).toBe("13/02/2026");
  });

  it("usa la hora de Cádiz y no la del proceso (UTC)", () => {
    // 08:30 UTC son las 09:30 en Madrid (ya día nuevo); en UTC aún sería ayer.
    expect(getActiveSessionDate(at("2026-02-13T08:30:00Z"), "09:00", TZ)).toBe("13/02/2026");
  });

  it("cruza fin de mes", () => {
    expect(getActiveSessionDate(at("2026-03-01T02:00:00+01:00"), "09:00", TZ)).toBe("28/02/2026");
  });
});

describe("getSessionStart", () => {
  it("devuelve el instante de inicio en hora de Cádiz", () => {
    expect(getSessionStart("13/02/2026", "20:00", TZ).toISOString()).toBe("2026-02-13T19:00:00.000Z");
  });
});

describe("estimateGroupTime", () => {
  it("suma minutesPerGroup por agrupación y pasa de medianoche", () => {
    expect(estimateGroupTime("20:00", 0, 45)).toBe("20:00");
    expect(estimateGroupTime("20:00", 3, 45)).toBe("22:15");
    expect(estimateGroupTime("20:00", 6, 45)).toBe("00:30");
    expect(estimateGroupTime("20:00", 14, 45)).toBe("06:30");
  });
});

describe("getLiveGroupIndex", () => {
  const start = at("2026-02-12T20:00:00+01:00");

  it("null antes de empezar", () => {
    expect(getLiveGroupIndex(at("2026-02-12T19:59:00+01:00"), start, 45, 8)).toBeNull();
  });

  it("avanza una agrupación cada minutesPerGroup", () => {
    expect(getLiveGroupIndex(at("2026-02-12T20:00:00+01:00"), start, 45, 8)).toBe(0);
    expect(getLiveGroupIndex(at("2026-02-12T20:44:00+01:00"), start, 45, 8)).toBe(0);
    expect(getLiveGroupIndex(at("2026-02-12T20:45:00+01:00"), start, 45, 8)).toBe(1);
    expect(getLiveGroupIndex(at("2026-02-13T00:30:00+01:00"), start, 45, 8)).toBe(6);
  });

  it("null cuando ya cantaron todas", () => {
    expect(getLiveGroupIndex(at("2026-02-13T02:00:00+01:00"), start, 45, 8)).toBeNull();
  });
});

describe("buildSchedule", () => {
  const group = (nombre: string): Group => ({
    ranking: "standar",
    modalidad: "CORO",
    nombre,
    autor: `Autor de ${nombre}`,
    ciudad: "Cádiz",
    id: `author2026${nombre}`,
    previous: null,
  });
  // Claves deliberadamente desordenadas: la app debe ordenar por fecha.
  const sessions: SessionsData = {
    "13/02/2026": [group("c1"), group("c2")],
    "11/02/2026": [group("a1"), group("a2")],
    "12/02/2026": [group("b1"), group("b2"), group("b3")],
  };

  it("clasifica por fecha y ordena", () => {
    const schedule = buildSchedule(sessions, at("2026-02-12T21:00:00+01:00"), config);

    expect(schedule.activeSessionDate).toBe("12/02/2026");
    expect(schedule.past.map((s) => s.date)).toEqual(["11/02/2026"]);
    expect(schedule.present?.date).toBe("12/02/2026");
    expect(schedule.future.map((s) => s.date)).toEqual(["13/02/2026"]);
    expect(schedule.nextSession?.date).toBe("13/02/2026");
  });

  it("marca en directo solo la agrupación de la sesión de hoy", () => {
    const schedule = buildSchedule(sessions, at("2026-02-12T21:00:00+01:00"), config);

    expect(schedule.present?.performances.map((p) => p.isLive)).toEqual([false, true, false]);
    expect(schedule.present?.performances.map((p) => p.estimatedTime)).toEqual(["20:00", "20:45", "21:30"]);
    expect(schedule.future[0].performances.some((p) => p.isLive)).toBe(false);
    expect(schedule.past[0].performances.some((p) => p.isLive)).toBe(false);
  });

  it("estima la hora de fin de cada sesión", () => {
    const schedule = buildSchedule(sessions, at("2026-02-12T21:00:00+01:00"), config);

    expect(schedule.present?.estimatedEndTime).toBe("22:15");
    expect(schedule.past[0].estimatedEndTime).toBe("21:30");
  });

  it("la cuenta atrás apunta a la sesión de hoy mientras no ha empezado", () => {
    const before = buildSchedule(sessions, at("2026-02-12T18:30:00+01:00"), config);
    expect(before.present?.date).toBe("12/02/2026");
    expect(before.upcomingSession?.date).toBe("12/02/2026");

    const live = buildSchedule(sessions, at("2026-02-12T21:00:00+01:00"), config);
    expect(live.upcomingSession?.date).toBe("13/02/2026");
  });

  it("antes de la primera sesión todo es futuro y hay cuenta atrás", () => {
    const schedule = buildSchedule(sessions, at("2026-02-09T12:00:00+01:00"), config);

    expect(schedule.present).toBeNull();
    expect(schedule.past).toEqual([]);
    expect(schedule.nextSession?.date).toBe("11/02/2026");
    expect(schedule.nextSession?.startsAt.toISOString()).toBe("2026-02-11T19:00:00.000Z");
    expect(schedule.upcomingSession).toBe(schedule.nextSession);
  });

  it("de madrugada la sesión de ayer sigue siendo la de hoy", () => {
    const schedule = buildSchedule(sessions, at("2026-02-13T00:30:00+01:00"), config);

    expect(schedule.present?.date).toBe("12/02/2026");
    expect(schedule.present?.performances.every((p) => !p.isLive)).toBe(true);
    expect(schedule.upcomingSession?.date).toBe("13/02/2026");
  });

  it("terminada la fase solo quedan sesiones pasadas", () => {
    const schedule = buildSchedule(sessions, at("2026-02-20T12:00:00+01:00"), config);

    expect(schedule.present).toBeNull();
    expect(schedule.future).toEqual([]);
    expect(schedule.nextSession).toBeNull();
    expect(schedule.upcomingSession).toBeNull();
    expect(schedule.past.map((s) => s.date)).toEqual(["11/02/2026", "12/02/2026", "13/02/2026"]);
  });
});
