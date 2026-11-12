import { describe, expect, it } from "vitest";
import {
  addDays,
  formatLongDate,
  formatZonedIso,
  formatSessionTitleDate,
  formatShortDate,
  formatMinutesOfDay,
  formatSessionDate,
  getZonedParts,
  parseSessionDate,
  sortSessionDates,
  zonedTimeToInstant,
} from "./dates";

describe("parseSessionDate", () => {
  it("parsea dd/mm/yyyy", () => {
    expect(parseSessionDate("12/02/2026")).toEqual({ year: 2026, month: 2, day: 12 });
  });

  it.each(["31/02/2026", "1/2/2026", "2026-02-12", "12/13/2026", "", "12/02/26"])("rechaza %j", (value) => {
    expect(parseSessionDate(value)).toBeNull();
  });
});

describe("formatSessionDate / addDays", () => {
  it("ida y vuelta con ceros a la izquierda", () => {
    expect(formatSessionDate({ year: 2026, month: 2, day: 3 })).toBe("03/02/2026");
  });

  it("cruza fin de mes y de año", () => {
    expect(addDays({ year: 2026, month: 3, day: 1 }, -1)).toEqual({ year: 2026, month: 2, day: 28 });
    expect(addDays({ year: 2027, month: 1, day: 1 }, -1)).toEqual({ year: 2026, month: 12, day: 31 });
  });
});

describe("sortSessionDates", () => {
  it("ordena por fecha, no alfabéticamente", () => {
    expect(sortSessionDates(["01/02/2026", "30/01/2026", "11/01/2027", "02/02/2026"])).toEqual([
      "30/01/2026",
      "01/02/2026",
      "02/02/2026",
      "11/01/2027",
    ]);
  });
});

describe("formatMinutesOfDay", () => {
  it("da la vuelta pasada la medianoche", () => {
    expect(formatMinutesOfDay(20 * 60)).toBe("20:00");
    expect(formatMinutesOfDay(24 * 60 + 30)).toBe("00:30");
    expect(formatMinutesOfDay(-30)).toBe("23:30");
  });
});

describe("formatLongDate", () => {
  it("escribe la fecha larga en español", () => {
    expect(formatLongDate("12/02/2026")).toBe("jueves, 12 de febrero de 2026");
  });

  it("no lanza con una fecha inválida", () => {
    expect(formatLongDate("mañana")).toBe("mañana");
  });
});

describe("zonas horarias (el proceso corre en UTC)", () => {
  it("el proceso de test no está en la zona de Cádiz", () => {
    expect(new Date(2026, 1, 12).getTimezoneOffset()).toBe(0);
  });

  it("getZonedParts da la hora de pared de Madrid", () => {
    expect(getZonedParts(new Date("2026-02-12T23:30:00Z"), "Europe/Madrid")).toEqual({
      year: 2026,
      month: 2,
      day: 13,
      hour: 0,
      minute: 30,
    });
  });

  it("zonedTimeToInstant respeta invierno (UTC+1) y verano (UTC+2)", () => {
    const winter = zonedTimeToInstant({ year: 2026, month: 2, day: 13 }, 20, 0, "Europe/Madrid");
    const summer = zonedTimeToInstant({ year: 2026, month: 7, day: 15 }, 20, 0, "Europe/Madrid");
    expect(winter.toISOString()).toBe("2026-02-13T19:00:00.000Z");
    expect(summer.toISOString()).toBe("2026-07-15T18:00:00.000Z");
  });

  it("zonedTimeToInstant acierta a ambos lados del cambio de hora", () => {
    // El 29/03/2026 a las 02:00 Madrid pasa de UTC+1 a UTC+2.
    const before = zonedTimeToInstant({ year: 2026, month: 3, day: 28 }, 20, 0, "Europe/Madrid");
    const after = zonedTimeToInstant({ year: 2026, month: 3, day: 29 }, 20, 0, "Europe/Madrid");
    expect(before.toISOString()).toBe("2026-03-28T19:00:00.000Z");
    expect(after.toISOString()).toBe("2026-03-29T18:00:00.000Z");
  });
});

describe("formatSessionTitleDate", () => {
  it("da el día y el mes con la inicial en mayúscula, sin año", () => {
    expect(formatSessionTitleDate("21/01/2027")).toBe("Jueves 21 de enero");
    expect(formatSessionTitleDate("09/01/2027")).toBe("Sábado 9 de enero");
  });

  it("devuelve el texto tal cual si no es una fecha", () => {
    expect(formatSessionTitleDate("mañana")).toBe("mañana");
  });
});

describe("formatShortDate", () => {
  it("escribe el día de la semana abreviado y el día", () => {
    expect(formatShortDate("12/02/2026")).toBe("jue 12");
    expect(formatShortDate("09/01/2027")).toBe("sáb 9");
  });

  it("no lanza con una fecha inválida", () => {
    expect(formatShortDate("mañana")).toBe("mañana");
  });
});

describe("formatZonedIso", () => {
  it("escribe la hora de Madrid con su desfase (invierno y verano)", () => {
    const winter = zonedTimeToInstant({ year: 2027, month: 1, day: 8 }, 20, 0, "Europe/Madrid");
    expect(formatZonedIso(winter, "Europe/Madrid")).toBe("2027-01-08T20:00:00+01:00");
    const summer = zonedTimeToInstant({ year: 2027, month: 7, day: 8 }, 20, 0, "Europe/Madrid");
    expect(formatZonedIso(summer, "Europe/Madrid")).toBe("2027-07-08T20:00:00+02:00");
  });

  it("no depende de la zona del proceso", () => {
    expect(formatZonedIso(new Date("2027-01-08T19:00:00Z"), "Europe/Madrid")).toBe(
      "2027-01-08T20:00:00+01:00",
    );
    expect(formatZonedIso(new Date("2027-01-08T19:00:00Z"), "UTC")).toBe("2027-01-08T19:00:00+00:00");
  });
});
