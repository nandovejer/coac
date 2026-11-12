import { jsPDF } from "jspdf";
import { SEASON } from "../../config/season";
import type { PerformanceView } from "../../domain/schedule";
import { formatSessionTitleDate } from "../../lib/dates";
import { flowColumns } from "./columns";
import { actOrder, capitalize } from "./format";
import type { PrintBlock } from "./PrintSheet";

/**
 * Genera el horario como PDF en el navegador (jsPDF, que solo se descarga al
 * pulsar «Descargar PDF»). A4 vertical con texto seleccionable y la misma hoja
 * que la impresión: dos columnas de sesiones, cada sesión en su tabla (nº de
 * orden, agrupación con autoría y ciudad, y modalidad), entera en una columna
 * si cabe. Sin horas: solo el orden. Semáforo con forma (círculo lleno:
 * imprescindible; anillo: recomendada). Medidas en milímetros.
 */
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 12;
const MARGIN_TOP = 14;
const MARGIN_BOTTOM = 16;
const COLUMNS = 2;
const GAP = 7;
const COL_W = (PAGE_W - MARGIN_X * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
const ORDER_W = 6.5;
const MOD_W = 16.5;
const NAME_W = COL_W - ORDER_W - MOD_W;
const PAD = 1.4;
const DAY_H = 6.5;
const HEAD_H = 4.6;
const ROW_H = 7.2;
const SESSION_GAP = 4.5;

type Rgb = [number, number, number];
const INK: Rgb = [17, 17, 17];
const MUTED: Rgb = [75, 75, 75];
const LINE: Rgb = [200, 200, 200];
const HEAD_BG: Rgb = [232, 232, 232];
const ZEBRA: Rgb = [244, 244, 244];
const TOP: Rgb = [21, 128, 61];
const OK: Rgb = [161, 98, 7];

const titleCase = (text: string) => text.toLowerCase().replace(/(^|[\s'(-])\p{L}/gu, (c) => c.toUpperCase());

/** Lo que se reparte en columnas: una sesión entera o, si no cabe, su cabecera y sus filas. */
type Item =
  | { type: "session"; block: PrintBlock }
  | { type: "head"; block: PrintBlock }
  | { type: "row"; block: PrintBlock; row: PerformanceView; index: number; last: boolean };

export function downloadSchedulePdf(blocks: PrintBlock[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  doc.setProperties({ title: `Mi horario · COAC ${SEASON.year}`, subject: SEASON.phaseTitle });

  const font = (size: number, bold = false, color: Rgb = INK) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const text = (value: string, x: number, y: number, size: number, bold = false, color: Rgb = INK) => {
    font(size, bold, color);
    doc.text(value, x, y);
    return doc.getTextWidth(value);
  };
  /** Texto alineado a la derecha de `right`. */
  const textEnd = (value: string, right: number, y: number, size: number, bold = false, color: Rgb = INK) => {
    font(size, bold, color);
    doc.text(value, right - doc.getTextWidth(value), y);
  };

  /** Recorta con «…» para que quepa en `max` mm (con la fuente ya puesta). */
  const fit = (value: string, max: number) => {
    if (doc.getTextWidth(value) <= max) return value;
    let cut = value;
    while (cut.length > 1 && doc.getTextWidth(`${cut}…`) > max) cut = cut.slice(0, -1);
    return `${cut.trimEnd()}…`;
  };

  const mark = (ranking: "top" | "ok", cx: number, cy: number) => {
    if (ranking === "top") {
      doc.setFillColor(...TOP);
      doc.circle(cx, cy, 1.05, "F");
    } else {
      doc.setDrawColor(...OK);
      doc.setLineWidth(0.4);
      doc.circle(cx, cy, 0.9, "S");
    }
  };

  const hline = (x: number, y: number, width: number, thickness: number, color: Rgb) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(thickness);
    doc.line(x, y, x + width, y);
  };
  const vline = (x: number, y: number, height: number, thickness: number, color: Rgb) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(thickness);
    doc.line(x, y, x, y + height);
  };
  const fill = (x: number, y: number, width: number, height: number, color: Rgb) => {
    doc.setFillColor(...color);
    doc.rect(x, y, width, height, "F");
  };

  /** Rejilla de una franja de la tabla: separadores grises y bordes exteriores negros. */
  const grid = (x0: number, top: number, height: number) => {
    vline(x0 + ORDER_W, top, height, 0.15, LINE);
    vline(x0 + COL_W - MOD_W, top, height, 0.15, LINE);
    vline(x0, top, height, 0.3, INK);
    vline(x0 + COL_W, top, height, 0.3, INK);
  };

  // Cabecera de la primera página
  let y = MARGIN_TOP + 3;
  text(`¿QUIÉN CANTA HOY? · COAC ${SEASON.year}`, MARGIN_X, y, 7.5, true, MUTED);
  y += 7;
  font(15, true);
  text(fit(`Mi horario · ${SEASON.phaseTitle}`, PAGE_W - MARGIN_X * 2), MARGIN_X, y, 15, true);
  y += 5.5;
  let x = MARGIN_X;
  x += text("Por orden de actuación.", x, y, 7.5, false, MUTED) + 3;
  mark("top", x + 1.05, y - 0.9);
  x += 3.2 + text("Imprescindible", x + 3.2, y, 7.5, false, MUTED) + 3;
  mark("ok", x + 1.05, y - 0.9);
  text("Recomendada", x + 3.2, y, 7.5, false, MUTED);
  y += 3.5;
  hline(MARGIN_X, y, PAGE_W - MARGIN_X * 2, 0.5, INK);
  y += 5;
  const firstTop = y;

  const usable = (page: number) => PAGE_H - MARGIN_BOTTOM - (page === 0 ? firstTop : MARGIN_TOP);

  // Una sesión es un bloque; solo si no cabe en una columna se reparte fila a fila
  const sessionHeight = (block: PrintBlock) => DAY_H + HEAD_H + block.rows.length * ROW_H + SESSION_GAP;
  const items: Item[] = blocks.flatMap((block): Item[] =>
    sessionHeight(block) <= usable(1)
      ? [{ type: "session", block }]
      : [
          { type: "head", block },
          ...block.rows.map((row, index) => ({
            type: "row" as const,
            block,
            row,
            index,
            last: index === block.rows.length - 1,
          })),
        ],
  );
  const heightOf = (item: Item) =>
    item.type === "session"
      ? sessionHeight(item.block)
      : item.type === "head"
        ? DAY_H + HEAD_H
        : ROW_H + (item.last ? SESSION_GAP : 0);

  /** Título de la sesión y cabecera gris de su tabla. */
  const drawHead = (block: PrintBlock, x0: number, top: number) => {
    const width = text(formatSessionTitleDate(block.session.date), x0, top + 4.2, 9.5, true);
    text(` · ${block.rows.length}`, x0 + width, top + 4.2, 9.5, false, MUTED);
    const head = top + DAY_H;
    fill(x0, head, COL_W, HEAD_H, HEAD_BG);
    textEnd("Nº", x0 + ORDER_W - PAD, head + 3.2, 6.5, true);
    text("AGRUPACIÓN", x0 + ORDER_W + PAD, head + 3.2, 6.5, true);
    text("MODALIDAD", x0 + COL_W - MOD_W + PAD, head + 3.2, 6.5, true);
    grid(x0, head, HEAD_H);
    hline(x0, head, COL_W, 0.3, INK);
    hline(x0, head + HEAD_H, COL_W, 0.3, INK);
  };

  const drawRow = (
    block: PrintBlock,
    { group }: PerformanceView,
    index: number,
    last: boolean,
    x0: number,
    top: number,
  ) => {
    if (index % 2 === 1) fill(x0, top, COL_W, ROW_H, ZEBRA);
    textEnd(String(actOrder(block.session, group)), x0 + ORDER_W - PAD, top + 3.1, 8, true);

    let nameX = x0 + ORDER_W + PAD;
    if (group.ranking !== "standar") {
      mark(group.ranking, nameX + 1.05, top + 2.25);
      nameX += 3.2;
    }
    font(8, true);
    text(fit(group.nombre, x0 + COL_W - MOD_W - PAD - nameX), nameX, top + 3.1, 8, true);
    font(6.8);
    const meta = `${titleCase(group.autor)} · ${group.ciudad}`;
    text(fit(meta, NAME_W - PAD * 2), x0 + ORDER_W + PAD, top + 6, 6.8, false, MUTED);
    text(capitalize(group.modalidad), x0 + COL_W - MOD_W + PAD, top + 3.1, 7.5);

    grid(x0, top, ROW_H);
    hline(x0, top + ROW_H, COL_W, last ? 0.3 : 0.15, last ? INK : LINE);
  };

  for (const { item, page, column, y: top } of flowColumns(items, heightOf, {
    columns: COLUMNS,
    height: usable,
    keepWithNext: (item) => item.type === "head",
  })) {
    while (doc.getNumberOfPages() <= page) doc.addPage();
    doc.setPage(page + 1);
    const x0 = MARGIN_X + column * (COL_W + GAP);
    const at = (page === 0 ? firstTop : MARGIN_TOP) + top;
    if (item.type === "session") {
      const { block } = item;
      drawHead(block, x0, at);
      block.rows.forEach((row, index) =>
        drawRow(block, row, index, index === block.rows.length - 1, x0, at + DAY_H + HEAD_H + index * ROW_H),
      );
    } else if (item.type === "head") drawHead(item.block, x0, at);
    else drawRow(item.block, item.row, item.index, item.last, x0, at);
  }

  // Pie de cada página
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    text("coac.com.es", MARGIN_X, PAGE_H - 8, 7.5, false, MUTED);
    textEnd(`Página ${page} de ${pages}`, PAGE_W - MARGIN_X, PAGE_H - 8, 7.5, false, MUTED);
  }

  doc.save(`horario-coac-${SEASON.year}.pdf`);
}
