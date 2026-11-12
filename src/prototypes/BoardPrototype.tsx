import AgendaPrototype from "./AgendaPrototype";
import "./BoardPrototype.css";

/**
 * Prototipo «Tablero»: la estructura de «Agenda» (: línea de tiempo, tarjetas,
 * fichas de días) con una estética de tablero (columna negra con
 * azul, monoespaciada, formas rectas y piloto de color).
 */
export default function BoardPrototype() {
  return <AgendaPrototype skin="board" />;
}
