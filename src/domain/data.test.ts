import { describe, expect, it } from "vitest";
import schema from "../data/coac-session.schema.json";
import { MODALIDADES, RANKINGS } from "../types";
import { validateSessions } from "./validate";

// Toda fase de COAC_<año>_<FASE>.json debe pasar la validación; la clave del
// año anterior es el año del propio archivo menos uno.
const files = import.meta.glob("../data/COAC_*.json", { eager: true, import: "default" });

describe("JSON de datos de las fases", () => {
  it("hay al menos una fase", () => {
    expect(Object.keys(files).length).toBeGreaterThan(0);
  });

  it.each(Object.entries(files))("%s es válido", (path, data) => {
    const year = Number(/COAC_(\d{4})_/.exec(path)?.[1]);
    expect(validateSessions(data, year - 1)).toEqual([]);
  });
});

describe("coac-session.schema.json", () => {
  it("lista las mismas modalidades y rankings que el código", () => {
    const { properties } = schema.definitions.agrupacion;
    expect(properties.modalidad.enum).toEqual([...MODALIDADES]);
    expect(properties.ranking.enum).toEqual([...RANKINGS]);
  });
});
