import VariantC from "./VariantC";
import "./VariantD.css";

/**
 * Variante D: la estructura de la C («Agenda»: línea de tiempo, tarjetas,
 * fichas de días) con la estética de la B («Tablero»: columna negra con
 * azul, monoespaciada, formas rectas y piloto de color).
 */
export default function VariantD() {
  return <VariantC skin="board" />;
}
