import { jsPDF } from "jspdf";
import { SEASON } from "../../config/season";
import { flowColumns } from "./columns";
import { PRIZES, porraItems, type Porra, type PorraItem } from "./porra";

/**
 * La porra en PDF, generada en el navegador (jsPDF solo se descarga al
 * pulsar). A4 vertical, medidas en milímetros. «¿Quién pasa?»: tres columnas
 * con una casilla por agrupación. Final: una tabla por modalidad con las
 * casillas del 1.º al 4.º.
 */
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 12;
const MARGIN_TOP = 14;
const MARGIN_BOTTOM = 16;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const COLUMNS = 3;
const GAP = 6;
const COL_W = (CONTENT_W - GAP * (COLUMNS - 1)) / COLUMNS;
const BOX = 2.8;
const LINE = 3.1;
const NAME_SIZE = 7.5;
const HEADING_H = 10;
const PRIZE_W = 14;
const PRIZE_ROW = 8;
const PRIZE_HEADING = 7;

type Rgb = [number, number, number];
const INK: Rgb = [17, 17, 17];
const MUTED: Rgb = [75, 75, 75];
const RULE: Rgb = [200, 200, 200];

const titleCase = (text: string) => text.toLowerCase().replace(/(^|[\s'(-])\p{L}/gu, (c) => c.toUpperCase());

export function downloadPorraPdf(porra: Porra) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  doc.setProperties({ title: `${porra.title} · COAC ${SEASON.year}` });

  const font = (size: number, bold = false, color: Rgb = INK) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const text = (
    value: string | string[],
    x: number,
    y: number,
    size: number,
    bold = false,
    color: Rgb = INK,
  ) => {
    font(size, bold, color);
    doc.text(value, x, y, { lineHeightFactor: 1.15 });
  };
  const line = (x1: number, y: number, x2: number, width: number, color: Rgb) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(width);
    doc.line(x1, y, x2, y);
  };
  const box = (x: number, y: number, size: number) => {
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.25);
    doc.rect(x, y, size, size, "S");
  };

  // Cabecera
  let y = MARGIN_TOP + 3;
  text(`¿QUIÉN CANTA HOY? · COAC ${SEASON.year}`, MARGIN_X, y, 8, true, MUTED);
  y += 8;
  text(porra.title, MARGIN_X, y, 16, true);
  y += 6;
  text(porra.howTo, MARGIN_X, y, 8, false, MUTED);
  y += 8;
  text("Nombre", MARGIN_X, y, 9, true);
  line(MARGIN_X + 14, y + 0.6, MARGIN_X + 80, 0.25, INK);
  text("Aciertos", MARGIN_X + 88, y, 9, true);
  line(MARGIN_X + 104, y + 0.6, MARGIN_X + 124, 0.25, INK);
  y += 4;
  line(MARGIN_X, y, PAGE_W - MARGIN_X, 0.6, INK);
  y += 6;
  const firstTop = y;

  if (porra.kind === "pass") {
    // Alto de cada elemento: el nombre puede ocupar varias líneas
    font(NAME_SIZE);
    const lines = new Map<PorraItem, string[]>();
    const items = porraItems(porra);
    for (const item of items) {
      if (item.type === "group") lines.set(item, doc.splitTextToSize(item.group.nombre, COL_W - BOX - 2));
    }
    const heightOf = (item: PorraItem) =>
      item.type === "heading" ? HEADING_H : (lines.get(item)?.length ?? 1) * LINE + 1.3;
    const usable = (page: number) => PAGE_H - MARGIN_BOTTOM - (page === 0 ? firstTop : MARGIN_TOP);

    for (const { item, page, column, y: top } of flowColumns(items, heightOf, {
      columns: COLUMNS,
      height: usable,
      keepWithNext: (item) => item.type === "heading",
    })) {
      while (doc.getNumberOfPages() <= page) doc.addPage();
      doc.setPage(page + 1);
      const x = MARGIN_X + column * (COL_W + GAP);
      const at = (page === 0 ? firstTop : MARGIN_TOP) + top;
      if (item.type === "heading") {
        const label = item.title.toUpperCase();
        text(label, x, at + 6.5, 8.5, true);
        font(8.5, true);
        text(` (${item.count})`, x + doc.getTextWidth(label), at + 6.5, 8.5, false, MUTED);
        line(x, at + 8, x + COL_W, 0.35, INK);
      } else {
        box(x, at + 0.4, BOX);
        text(lines.get(item) ?? item.group.nombre, x + BOX + 2, at + 2.7, NAME_SIZE);
      }
    }
  } else {
    // Final: tabla por modalidad, entera en una página si cabe
    const prizesX = PAGE_W - MARGIN_X - PRIZE_W * PRIZES.length;
    for (const section of porra.sections) {
      const height = PRIZE_HEADING + 5 + section.groups.length * PRIZE_ROW + 4;
      if (y + height > PAGE_H - MARGIN_BOTTOM) {
        doc.addPage();
        y = MARGIN_TOP;
      }
      text(section.title.toUpperCase(), MARGIN_X, y + 5, 10, true);
      y += PRIZE_HEADING;
      text("AGRUPACIÓN", MARGIN_X, y + 3, 7, true, MUTED);
      PRIZES.forEach((prize, index) => {
        font(8, true);
        const cx = prizesX + index * PRIZE_W + PRIZE_W / 2;
        text(prize, cx - doc.getTextWidth(prize) / 2, y + 3, 8, true, MUTED);
      });
      line(MARGIN_X, y + 4.4, PAGE_W - MARGIN_X, 0.35, INK);
      y += 5;
      for (const group of section.groups) {
        font(9, true);
        const name = doc.splitTextToSize(group.nombre, prizesX - MARGIN_X - 4)[0] as string;
        text(name, MARGIN_X, y + 3.5, 9, true);
        font(7.5);
        const author = doc.splitTextToSize(titleCase(group.autor), prizesX - MARGIN_X - 4)[0] as string;
        text(author, MARGIN_X, y + 6.8, 7.5, false, MUTED);
        PRIZES.forEach((_, index) => {
          box(prizesX + index * PRIZE_W + (PRIZE_W - 4) / 2, y + (PRIZE_ROW - 4) / 2, 4);
        });
        line(MARGIN_X, y + PRIZE_ROW - 0.3, PAGE_W - MARGIN_X, 0.2, RULE);
        y += PRIZE_ROW;
      }
      y += 4;
    }
  }

  // Pie de cada página
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    text("coac.com.es", MARGIN_X, PAGE_H - 8, 7.5, false, MUTED);
    const label = `Página ${page} de ${pages}`;
    font(7.5);
    text(label, PAGE_W - MARGIN_X - doc.getTextWidth(label), PAGE_H - 8, 7.5, false, MUTED);
  }

  doc.save(`porra-coac-${SEASON.year}.pdf`);
}
