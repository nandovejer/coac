import { describe, expect, it } from "vitest";
import type { PerformanceView, SessionView } from "./schedule";
import type { Group } from "../types";
import { sessionBrief, sessionBriefText } from "./sessionBrief";

const performance = (nombre: string, ranking: Group["ranking"], estimatedTime: string): PerformanceView => ({
  group: {
    nombre,
    ranking,
    modalidad: "CHIRIGOTA",
    autor: "Autor",
    ciudad: "Cádiz",
    id: nombre,
    previous: null,
  },
  estimatedTime,
  isLive: false,
});

const session = (performances: PerformanceView[]): SessionView => ({
  date: "08/01/2027",
  status: "future",
  startsAt: new Date("2027-01-08T20:00:00+01:00"),
  estimatedEndTime: "02:00",
  performances,
});

describe("sessionBrief", () => {
  it("lists the must-see groups first and then the recommended ones, in order", () => {
    const text = sessionBriefText(
      session([
        performance("Uno", "ok", "20:00"),
        performance("Dos", "top", "20:45"),
        performance("Tres", "standar", "21:30"),
        performance("Cuatro", "top", "22:15"),
        performance("Cinco", "ok", "23:00"),
      ]),
    );
    expect(text).toBe(
      "No te pierdas «Dos» (chirigota, 20:45) y «Cuatro» (chirigota, 22:15). " +
        "También merecen la pena «Uno» (chirigota, 20:00) y «Cinco» (chirigota, 23:00).",
    );
  });

  it("uses the singular and commas where they belong", () => {
    const text = sessionBriefText(
      session([
        performance("A", "top", "20:00"),
        performance("B", "top", "20:45"),
        performance("C", "top", "21:30"),
        performance("D", "ok", "22:15"),
      ]),
    );
    expect(text).toContain("«A» (chirigota, 20:00), «B» (chirigota, 20:45) y «C» (chirigota, 21:30).");
    expect(text).toContain("También merece la pena «D»");
  });

  it("leads with the recommended groups when there is no must-see one", () => {
    expect(sessionBriefText(session([performance("Uno", "ok", "20:00")]))).toBe(
      "Lo más recomendable: «Uno» (chirigota, 20:00).",
    );
  });

  it("invites to discover when nothing stands out", () => {
    expect(sessionBriefText(session([performance("Uno", "standar", "20:00")]))).toBe(
      "Una agrupación sin imprescindibles ni recomendadas: buena noche para descubrir algo nuevo.",
    );
    expect(
      sessionBriefText(
        session([performance("Uno", "standar", "20:00"), performance("Dos", "standar", "20:45")]),
      ),
    ).toMatch(/^2 agrupaciones sin/);
  });

  it("marks only the group names as strong", () => {
    const strong = sessionBrief(session([performance("Uno", "top", "20:00")])).filter((part) => part.strong);
    expect(strong.map((part) => part.text)).toEqual(["«Uno»"]);
  });
});
