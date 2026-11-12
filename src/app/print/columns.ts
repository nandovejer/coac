/** Dónde va cada elemento al repartirlo en columnas (y páginas). */
export interface Placed<T> {
  item: T;
  page: number;
  column: number;
  /** Desde arriba de la columna. */
  y: number;
}

/**
 * Reparte elementos en columnas de arriba abajo, como un periódico: llena una
 * columna, pasa a la siguiente y, al acabar las columnas, a otra página. Un
 * título (`keepWithNext`) nunca se queda solo al pie de una columna. Lo usan los
 * PDF (en mm) y la imagen de la porra (en px).
 */
export function flowColumns<T>(
  items: T[],
  heightOf: (item: T) => number,
  options: { columns: number; height: (page: number) => number; keepWithNext?: (item: T) => boolean },
): Placed<T>[] {
  let page = 0;
  let column = 0;
  let y = 0;
  return items.map((item, index) => {
    let need = heightOf(item);
    const next = items[index + 1];
    if (next !== undefined && options.keepWithNext?.(item)) need += heightOf(next);
    if (y > 0 && y + need > options.height(page)) {
      column += 1;
      y = 0;
      if (column >= options.columns) {
        page += 1;
        column = 0;
      }
    }
    const placed = { item, page, column, y };
    y += heightOf(item);
    return placed;
  });
}
