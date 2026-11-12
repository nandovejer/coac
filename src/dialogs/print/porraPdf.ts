import { jsPDF } from "jspdf";
import { SEASON } from "../../config/season";
import type { Porra } from "./porra";
import { renderPorraCanvas } from "./porraCanvas";

/**
 * La porra en PDF, generada en el navegador (jsPDF solo se descarga al pulsar).
 * Es el mismo cartel que la hoja, dibujado en un canvas sobre papel blanco (el
 * fondo crema gastaría tinta) y puesto en una página A4, con el texto lo más
 * grande que deje caber todo en una sola hoja.
 */
const PAGE_W = 210;
const PAGE_H = 297;

export function downloadPorraPdf(porra: Porra) {
  // El texto más grande con el que todo cabe en una hoja: se prueba de mayor a menor
  let canvas = renderPorraCanvas(porra, { paper: "white", zoom: 0.9 });
  for (
    let zoom = 0.87;
    canvas.height / canvas.width > (PAGE_H / PAGE_W) * 1.01 && zoom >= 0.5;
    zoom -= 0.03
  ) {
    canvas = renderPorraCanvas(porra, { paper: "white", zoom });
  }
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  doc.setProperties({ title: `${porra.title} · COAC ${SEASON.year}` });

  const ratio = canvas.height / canvas.width;
  const height = Math.min(PAGE_H, PAGE_W * ratio);
  const width = height / ratio;
  doc.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", (PAGE_W - width) / 2, 0, width, height);
  doc.save(`porra-coac-${SEASON.year}.pdf`);
}
