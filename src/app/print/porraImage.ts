import type { Porra } from "./porra";
import { renderPorraCanvas } from "./porraCanvas";

/**
 * La porra como PNG (para pasarla por el móvil): el mismo cartel que la hoja,
 * dibujado en un canvas sobre papel crema (ver `porraCanvas.ts`).
 */
export function renderPorraImage(porra: Porra): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      renderPorraCanvas(porra, { paper: "cream", zoom: 0.85 }).toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo crear la imagen"))),
        "image/png",
      );
    } catch (error) {
      reject(error instanceof Error ? error : new Error("No se pudo crear la imagen"));
    }
  });
}
