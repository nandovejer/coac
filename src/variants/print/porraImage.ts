import { SEASON } from "../../config/season";
import { flowColumns, type Placed } from "./columns";
import { PRIZES, porraItems, type Porra, type PorraItem } from "./porra";

/**
 * La porra como PNG (para pasarla por el móvil), dibujada a mano en un canvas.
 * «¿Quién pasa?»: dos columnas equilibradas con una casilla por agrupación.
 * Final: una tabla por modalidad con las casillas del 1.º al 4.º.
 */
const WIDTH = 1080;
const PAD = 56;
const HEAD = 208;
const FOOT = 70;
const COLUMNS = 2;
const GAP = 40;
const COL_W = (WIDTH - PAD * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
const BOX = 22;
const LINE = 30;
const HEADING_H = 64;
const PRIZE_W = 90;
const PRIZE_ROW = 78;
const SECTION_GAP = 30;

const INK = "#111111";
const MUTED = "#4b4b4b";
const RULE = "#c8c8c8";
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const titleCase = (text: string) => text.toLowerCase().replace(/(^|[\s'(-])\p{L}/gu, (c) => c.toUpperCase());

/** Parte el texto en líneas que quepan en `max` píxeles (con la fuente ya puesta). */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > max) {
      lines.push(current);
      current = word;
    } else current = candidate;
  }
  if (current) lines.push(current);
  return lines;
}

function fit(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > max) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

export function renderPorraImage(porra: Porra): Promise<Blob> {
  // Un canvas de medida para calcular alturas antes de dibujar
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) return Promise.reject(new Error("Canvas no disponible"));

  const items = porraItems(porra);
  const lines = new Map<PorraItem, string[]>();
  let bodyHeight: number;
  let placed: Placed<PorraItem>[] = [];

  if (porra.kind === "pass") {
    measure.font = `400 22px ${FONT}`;
    for (const item of items) {
      if (item.type === "group") lines.set(item, wrap(measure, item.group.nombre, COL_W - BOX - 14));
    }
    const heightOf = (item: PorraItem) =>
      item.type === "heading" ? HEADING_H : (lines.get(item)?.length ?? 1) * LINE + 12;
    // Columnas equilibradas: la altura más baja con la que todo cabe en una «página»
    const total = items.reduce((sum, item) => sum + heightOf(item), 0);
    let height = Math.ceil(total / COLUMNS);
    const options = { columns: COLUMNS, keepWithNext: (item: PorraItem) => item.type === "heading" };
    placed = flowColumns(items, heightOf, { ...options, height: () => height });
    while (placed.some((p) => p.page > 0)) {
      height += 20;
      placed = flowColumns(items, heightOf, { ...options, height: () => height });
    }
    bodyHeight = height;
  } else {
    bodyHeight = porra.sections.reduce(
      (sum, section) => sum + HEADING_H + 40 + section.groups.length * PRIZE_ROW + SECTION_GAP,
      0,
    );
  }

  const canvasHeight = PAD + HEAD + bodyHeight + FOOT + PAD;
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * scale;
  canvas.height = canvasHeight * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas no disponible"));
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, canvasHeight);

  const write = (text: string, x: number, y: number, font: string, color = INK) => {
    ctx.font = `${font} ${FONT}`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    return ctx.measureText(text).width;
  };
  const rule = (x: number, y: number, width: number, thickness: number, color = INK) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, thickness);
  };
  const box = (x: number, y: number, size: number) => {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
  };

  // Cabecera
  let y = PAD;
  write(`¿QUIÉN CANTA HOY? · COAC ${SEASON.year}`, PAD, y + 22, "700 22px", MUTED);
  ctx.font = `800 40px ${FONT}`;
  write(fit(ctx, porra.title, WIDTH - PAD * 2), PAD, y + 76, "800 40px");
  ctx.font = `400 21px ${FONT}`;
  write(fit(ctx, porra.howTo, WIDTH - PAD * 2), PAD, y + 116, "400 21px", MUTED);
  const nameW = write("Nombre", PAD, y + 164, "700 22px");
  rule(PAD + nameW + 12, y + 166, 360, 2);
  const hitsX = PAD + nameW + 400;
  const hitsW = write("Aciertos", hitsX, y + 164, "700 22px");
  rule(hitsX + hitsW + 12, y + 166, 110, 2);
  y += HEAD;
  rule(PAD, y - 20, WIDTH - PAD * 2, 3);

  if (porra.kind === "pass") {
    for (const { item, column, y: top } of placed) {
      const x = PAD + column * (COL_W + GAP);
      const at = y + top;
      if (item.type === "heading") {
        const label = item.title.toUpperCase();
        const width = write(label, x, at + 42, "800 24px");
        write(` (${item.count})`, x + width, at + 42, "400 24px", MUTED);
        rule(x, at + 54, COL_W, 2);
      } else {
        box(x, at + 5, BOX);
        (lines.get(item) ?? [item.group.nombre]).forEach((text, index) => {
          write(text, x + BOX + 14, at + 23 + index * LINE, "400 22px");
        });
      }
    }
  } else {
    const prizesX = WIDTH - PAD - PRIZE_W * PRIZES.length;
    for (const section of porra.sections) {
      write(section.title.toUpperCase(), PAD, y + 42, "800 26px");
      y += HEADING_H;
      write("AGRUPACIÓN", PAD, y + 22, "700 18px", MUTED);
      PRIZES.forEach((prize, index) => {
        ctx.font = `700 20px ${FONT}`;
        const cx = prizesX + index * PRIZE_W + PRIZE_W / 2;
        write(prize, cx - ctx.measureText(prize).width / 2, y + 22, "700 20px", MUTED);
      });
      rule(PAD, y + 34, WIDTH - PAD * 2, 2);
      y += 40;
      for (const group of section.groups) {
        ctx.font = `700 26px ${FONT}`;
        write(fit(ctx, group.nombre, prizesX - PAD - 20), PAD, y + 34, "700 26px");
        ctx.font = `400 20px ${FONT}`;
        write(fit(ctx, titleCase(group.autor), prizesX - PAD - 20), PAD, y + 62, "400 20px", MUTED);
        PRIZES.forEach((_, index) => box(prizesX + index * PRIZE_W + (PRIZE_W - 32) / 2, y + 23, 32));
        rule(PAD, y + PRIZE_ROW - 2, WIDTH - PAD * 2, 1, RULE);
        y += PRIZE_ROW;
      }
      y += SECTION_GAP;
    }
  }

  write("coac.com.es", PAD, canvasHeight - PAD, "400 20px", MUTED);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo crear la imagen"))),
      "image/png",
    ),
  );
}
