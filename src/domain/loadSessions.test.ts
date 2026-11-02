import { describe, expect, it } from "vitest";
import type { RawSessions } from "../types";
import { filterByAuthor } from "./filterByAuthor";
import { createGroupIdGenerator, slugify } from "./ids";
import { loadSessions } from "./loadSessions";

const raw: RawSessions = {
  "12/02/2026": [
    {
      "2025": "Los romanos",
      ranking: "top",
      modalidad: "CORO",
      nombre: "Los fenicios",
      autor: "Antonio Martínez",
      ciudad: "Cádiz",
    },
    {
      "2025": "Nueva agrupación",
      ranking: "ok",
      modalidad: "CHIRIGOTA",
      nombre: "Los del puerto",
      autor: "Ana Ruiz",
      ciudad: "El Puerto",
    },
    {
      "2025": "",
      ranking: "standar",
      modalidad: "CUARTETO",
      nombre: "Sin dato",
      autor: "Ana Ruiz",
      ciudad: "Cádiz",
    },
  ],
  "11/02/2026": [
    {
      "2025": "El eco",
      ranking: "standar",
      modalidad: "COMPARSA",
      nombre: "La sombra",
      autor: "Manuel Cornejo",
      ciudad: "San Fernando",
    },
  ],
};

describe("slugify / createGroupIdGenerator", () => {
  it("quita acentos y símbolos", () => {
    expect(slugify("García Argüez (Chapa)")).toBe("garciaarguezchapa");
  });

  it("añade sufijo si dos agrupaciones dan el mismo id", () => {
    const nextId = createGroupIdGenerator(2026);
    const first = nextId({ autor: "Ana Ruiz", nombre: "A" });
    const second = nextId({ autor: "Ana Ruiz", nombre: "B" });
    const third = nextId({ autor: "ana  ruiz", nombre: "C" });
    expect([first, second, third]).toEqual([
      "author2026anaruiz",
      "author2026anaruiz-2",
      "author2026anaruiz-3",
    ]);
  });

  it("recurre al nombre si no hay autor", () => {
    expect(createGroupIdGenerator(2026)({ autor: "", nombre: "Los X" })).toBe("author2026losx");
  });
});

describe("loadSessions", () => {
  const sessions = loadSessions(raw, { year: 2026, previousYear: 2025 });
  const all = Object.values(sessions).flat();

  it("conserva todas las sesiones y agrupaciones, en el mismo orden", () => {
    expect(Object.keys(sessions)).toEqual(["12/02/2026", "11/02/2026"]);
    expect(sessions["12/02/2026"].map((g) => g.nombre)).toEqual([
      "Los fenicios",
      "Los del puerto",
      "Sin dato",
    ]);
  });

  it("no pierde ningún campo", () => {
    const [first] = sessions["12/02/2026"];
    expect(first).toMatchObject({
      ranking: "top",
      modalidad: "CORO",
      nombre: "Los fenicios",
      autor: "Antonio Martínez",
      ciudad: "Cádiz",
      previous: { year: 2025, name: "Los romanos" },
    });
  });

  it("distingue agrupación anterior, nueva y sin dato", () => {
    const [named, isNew, none] = sessions["12/02/2026"];
    expect(named.previous).toEqual({ year: 2025, name: "Los romanos" });
    expect(isNew.previous).toEqual({ year: 2025, isNew: true });
    expect(none.previous).toBeNull();
  });

  it("genera ids únicos", () => {
    const ids = all.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe("filterByAuthor", () => {
    it("busca sin distinguir mayúsculas y ordena por sesión", () => {
      const matches = filterByAuthor(sessions, "ANA");
      expect(matches.map((m) => [m.date, m.group.nombre])).toEqual([
        ["12/02/2026", "Los del puerto"],
        ["12/02/2026", "Sin dato"],
      ]);
    });

    it("sin coincidencias devuelve una lista vacía", () => {
      expect(filterByAuthor(sessions, "zzz")).toEqual([]);
    });
  });
});
