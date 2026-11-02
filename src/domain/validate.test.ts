import { describe, expect, it } from "vitest";
import { validateSessions } from "./validate";

const validGroup = {
  "2025": "Los de antes",
  ranking: "top",
  modalidad: "CORO",
  nombre: "Los de ahora",
  autor: "Alguien",
  ciudad: "Cádiz",
};

const withGroup = (overrides: Record<string, unknown>) => ({
  "12/02/2026": [{ ...validGroup, ...overrides }],
});

describe("validateSessions", () => {
  it("acepta datos correctos", () => {
    expect(validateSessions({ "12/02/2026": [validGroup] }, 2025)).toEqual([]);
  });

  it("acepta 'Nueva agrupación' como año anterior", () => {
    expect(validateSessions(withGroup({ "2025": "Nueva agrupación" }), 2025)).toEqual([]);
  });

  it("detecta una clave que no es fecha", () => {
    expect(validateSessions({ "12-02-2026": [validGroup] }, 2025)[0]).toMatch(/no es una fecha/);
    expect(validateSessions({ "31/02/2026": [validGroup] }, 2025)[0]).toMatch(/no es una fecha/);
  });

  it("detecta modalidad y ranking fuera de catálogo", () => {
    expect(validateSessions(withGroup({ modalidad: "COMPARZA" }), 2025).join()).toMatch(/modalidad/);
    expect(validateSessions(withGroup({ ranking: "mega" }), 2025).join()).toMatch(/ranking/);
  });

  it("detecta textos vacíos o ausentes", () => {
    expect(validateSessions(withGroup({ autor: "  " }), 2025).join()).toMatch(/autor/);
    expect(validateSessions(withGroup({ nombre: undefined }), 2025).join()).toMatch(/nombre/);
    expect(validateSessions(withGroup({ ciudad: "" }), 2025).join()).toMatch(/ciudad/);
  });

  it("detecta que falta la clave del año anterior", () => {
    const { "2025": _omitted, ...withoutPrevious } = validGroup;
    expect(_omitted).toBeDefined();
    expect(validateSessions({ "12/02/2026": [withoutPrevious] }, 2025).join()).toMatch(/falta "2025"/);
    // Un JSON de otra temporada no vale para esta.
    expect(validateSessions({ "12/02/2026": [validGroup] }, 2026).join()).toMatch(/falta "2026"/);
  });

  it("detecta campos desconocidos (typos)", () => {
    expect(validateSessions(withGroup({ autr: "x" }), 2025).join()).toMatch(/campo desconocido "autr"/);
  });

  it("detecta estructuras que no son sesiones", () => {
    expect(validateSessions([], 2025)).toHaveLength(1);
    expect(validateSessions({}, 2025)).toHaveLength(1);
    expect(validateSessions({ "12/02/2026": [] }, 2025)[0]).toMatch(/al menos una/);
  });
});
