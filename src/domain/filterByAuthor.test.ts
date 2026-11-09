import { describe, expect, it } from "vitest";
import type { Group, Modalidad, SessionsData } from "../types";
import { filterByAuthor } from "./filterByAuthor";

function group(autor: string, nombre: string, modalidad: Modalidad = "COMPARSA"): Group {
  return { ranking: "standar", modalidad, nombre, autor, ciudad: "Cádiz", id: nombre, previous: null };
}

const sessions: SessionsData = {
  "12/01/2027": [group("Alejandro Pérez 'Peluca'", "Los torpes"), group("Ana Ruiz", "La sombra")],
  "19/01/2027": [group("Alejandro Pérez 'Peluca'", "Los ascetas", "CHIRIGOTA")],
  "20/01/2027": [
    group("Manu Peinado", "Los tres", "CUARTETO"),
    group("Manu Peinado", "Los cuatro", "CUARTETO"),
  ],
};

describe("filterByAuthor", () => {
  it("busca sin distinguir mayúsculas y ordena por sesión", () => {
    expect(filterByAuthor(sessions, "PELUCA").map((m) => m.group.nombre)).toEqual([
      "Los torpes",
      "Los ascetas",
    ]);
  });

  it("deja el autor tal cual si no se repite", () => {
    expect(filterByAuthor(sessions, "ana")[0].label).toBe("Ana Ruiz");
  });

  it("añade la modalidad cuando el mismo autor sale en varias agrupaciones", () => {
    expect(filterByAuthor(sessions, "peluca").map((m) => m.label)).toEqual([
      "Alejandro Pérez 'Peluca' - COMPARSA",
      "Alejandro Pérez 'Peluca' - CHIRIGOTA",
    ]);
  });

  it("añade también el nombre si la modalidad tampoco distingue", () => {
    expect(filterByAuthor(sessions, "peinado").map((m) => m.label)).toEqual([
      "Manu Peinado - CUARTETO - Los tres",
      "Manu Peinado - CUARTETO - Los cuatro",
    ]);
  });
});
