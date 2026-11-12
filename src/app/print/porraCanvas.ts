import { SEASON } from "../../config/season";
import { FACADE, FACADE_VIEWBOX } from "../../components/ui/facade";
import type { Modalidad } from "../../types";
import { PRIZES, type Porra, type PorraSection } from "./porra";
import { CONFETTI, ICON_SHAPES, MASK, type Shape } from "./porraShapes";

/**
 * El cartel de la porra dibujado en un canvas, igual que la hoja de la pantalla
 * (`PorraSheet`): cabecera con antifaz, sello y confeti, cinta, huecos de nombre y
 * aciertos, las modalidades en dos columnas con su color e icono, «Recuerda» y la
 * franja del pie. Lo usan la imagen (papel crema) y el PDF (papel blanco, que
 * gasta menos tinta). A4 a 300 ppp (2480 px de ancho). `zoom` encoge el dibujo
 * para que quepan más agrupaciones por hoja: con 0,8 una porra de unas 120
 * agrupaciones entra en un A4 y el texto queda en unos 7 pt; si aun así no cabe,
 * el lienzo crece.
 */
export const PORRA_WIDTH = 1240;
export const PORRA_MIN_HEIGHT = 1754;

const PAD = 64;
const COLUMN_GAP = 64;
const SCALE = 2; // nítido en pantallas de alta densidad y al imprimir

// Los colores del papel: los mismos que `.coac-porra` (PorraSheet.css)
const COLOR = {
  paper: "#fbf5e8",
  white: "#ffffff",
  ink: "#1c2a56",
  muted: "#4a5272",
  rule: "#b9ad92",
  cobalt: "#2d51a5",
  violet: "#6b2a8f",
  coro: "#1f4aa8",
  comparsa: "#5b2a9e",
  chirigota: "#a01d5c",
  cuarteto: "#4a5568",
  confetti: ["#2d51a5", "#8a3ab9", "#d0458a", "#3aa0c8"],
};
const MODALIDAD_COLOR: Record<Modalidad, string> = {
  CORO: COLOR.coro,
  COMPARSA: COLOR.comparsa,
  CHIRIGOTA: COLOR.chirigota,
  CUARTETO: COLOR.cuarteto,
};

const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const SERIF =
  '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, "Times New Roman", serif';

type Ctx = CanvasRenderingContext2D;

/** Parte el texto en líneas que quepan en `max` píxeles (con la fuente ya puesta). */
function wrap(ctx: Ctx, text: string, max: number) {
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

const titleCase = (text: string) => text.toLowerCase().replace(/(^|[\s'(-])\p{L}/gu, (c) => c.toUpperCase());

/** Texto con tracking (separación entre letras), a mano: `letterSpacing` no está en todos los navegadores. */
function spacedWidth(ctx: Ctx, text: string, spacing: number) {
  return [...text].reduce((sum, char) => sum + ctx.measureText(char).width + spacing, 0) - spacing;
}

function spaced(ctx: Ctx, text: string, x: number, y: number, spacing: number) {
  let cursor = x;
  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + spacing;
  }
}

function setFont(ctx: Ctx, font: string, color: string) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
}

/** Pinta una lista de formas SVG: `box` es el lado del cuadro y `view` el lado de su viewBox. */
function drawShapes(ctx: Ctx, shapes: Shape[], x: number, y: number, box: number, view: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(box / view, box / view);
  for (const shape of shapes) {
    if (shape.kind === "path") ctx.stroke(new Path2D(shape.d));
    else {
      ctx.beginPath();
      if (shape.kind === "ellipse") ctx.ellipse(shape.cx, shape.cy, shape.rx, shape.ry, 0, 0, Math.PI * 2);
      else ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Banda de color pleno con los bordes irregulares (el `clip-path` de la hoja). */
function brushBand(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  const points: [number, number][] = [
    [0, 0.1],
    [0.02, 0],
    [0.4, 0.06],
    [0.7, 0],
    [0.98, 0.04],
    [1, 0.3],
    [0.99, 0.7],
    [1, 1],
    [0.6, 0.94],
    [0.25, 1],
    [0.01, 0.95],
    [0, 0.6],
  ];
  ctx.beginPath();
  points.forEach(([px, py], index) =>
    index ? ctx.lineTo(x + px * w, y + py * h) : ctx.moveTo(x + px * w, y + py * h),
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawMask(ctx: Ctx, x: number, y: number, width: number) {
  const k = width / 120;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  const tones = [COLOR.confetti[3], COLOR.violet, COLOR.confetti[2]];
  MASK.feathers.forEach(({ d }, index) => {
    ctx.fillStyle = tones[index];
    ctx.fill(new Path2D(d));
  });
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = COLOR.ink;
  ctx.fillStyle = COLOR.violet;
  const face = new Path2D(MASK.face);
  ctx.fill(face);
  ctx.stroke(face);
  ctx.lineWidth = 2;
  ctx.fillStyle = COLOR.paper;
  for (const eye of MASK.eyes) {
    ctx.beginPath();
    ctx.ellipse(eye.cx, eye.cy, eye.rx, eye.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.lineWidth = 1.5;
  ctx.fillStyle = COLOR.confetti[3];
  ctx.beginPath();
  ctx.arc(MASK.gem.cx, MASK.gem.cy, MASK.gem.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Sello redondo «¡Que suene el Carnaval!» con la fachada del Falla en medio. */
function drawStamp(ctx: Ctx, cx: number, cy: number, size: number) {
  const k = size / 100;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((12 * Math.PI) / 180);
  ctx.scale(k, k);
  ctx.strokeStyle = COLOR.cobalt;
  ctx.fillStyle = COLOR.cobalt;
  ctx.lineWidth = 2.2;
  for (const radius of [47, 33]) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  // La leyenda, repartida a lo largo del círculo de radio 40 desde arriba
  const label = "¡QUE SUENE EL CARNAVAL! · COAC ·";
  ctx.font = `800 9.5px ${SANS}`;
  const widths = [...label].map((char) => ctx.measureText(char).width);
  const total = widths.reduce((sum, w) => sum + w, 0);
  let travelled = 0;
  [...label].forEach((char, index) => {
    const angle = -Math.PI / 2 + ((travelled + widths[index] / 2) / total) * Math.PI * 2;
    travelled += widths[index];
    ctx.save();
    ctx.rotate(angle + Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText(char, 0, -40);
    ctx.restore();
  });
  // La fachada, centrada en el 38 % del sello
  const [vx, vy, vw] = FACADE_VIEWBOX;
  const logo = 38;
  ctx.translate(-logo / 2, -logo / 2);
  ctx.scale(logo / vw, logo / vw);
  ctx.translate(-vx, -vy);
  ctx.fill(new Path2D(FACADE), "evenodd");
  ctx.restore();
}

function drawBox(ctx: Ctx, x: number, y: number, size: number, line = 2.4) {
  ctx.fillStyle = COLOR.white;
  ctx.fillRect(x, y, size, size);
  ctx.lineWidth = line;
  ctx.strokeStyle = COLOR.ink;
  ctx.strokeRect(x + line / 2, y + line / 2, size - line, size - line);
}

interface Block {
  height: number;
  draw: (x: number, y: number) => void;
}

const ICON = 56;
const BANNER_H = 52;
const ITEM_FONT = `400 22px ${SANS}`;
const ITEM_LINE = 28;
const ITEM_PAD = 5;
const BOX = 24;
const PRIZE_W = 74;
const PRIZE_ROW = 86;

/** Una modalidad: icono y banda con el título, y debajo la lista o la tabla de premios. */
function sectionBlock(ctx: Ctx, section: PorraSection, prizes: boolean, width: number): Block {
  const head = ICON + 14;
  const color = MODALIDAD_COLOR[section.modalidad];
  const title = `${section.title.toUpperCase()}`;
  const count = ` (${section.groups.length})`;

  const drawHead = (x: number, y: number) => {
    ctx.save();
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    drawShapes(ctx, ICON_SHAPES[section.modalidad], x, y + (BANNER_H - ICON) / 2, ICON, 24);
    ctx.restore();
    const bandX = x + ICON + 16;
    brushBand(ctx, bandX, y, width - ICON - 16, BANNER_H, color);
    setFont(ctx, `800 28px ${SERIF}`, COLOR.white);
    spaced(ctx, title, bandX + 22, y + 36, 1.4);
    const w = spacedWidth(ctx, title, 1.4);
    ctx.font = `400 28px ${SERIF}`;
    spaced(ctx, count, bandX + 22 + w + 1.4, y + 36, 1.4);
  };

  if (!prizes) {
    // Dos subcolumnas de altura parecida, sin partir ninguna agrupación
    const subWidth = (width - 28) / 2;
    ctx.font = ITEM_FONT;
    const items = section.groups.map((group) => ({
      lines: wrap(ctx, group.nombre, subWidth - BOX - 14),
    }));
    const heightOf = (item: { lines: string[] }) => item.lines.length * ITEM_LINE + ITEM_PAD * 2;
    let best = { index: items.length, tall: Infinity };
    for (let index = 0; index <= items.length; index++) {
      const left = items.slice(0, index).reduce((sum, item) => sum + heightOf(item), 0);
      const right = items.slice(index).reduce((sum, item) => sum + heightOf(item), 0);
      if (Math.max(left, right) < best.tall) best = { index, tall: Math.max(left, right) };
    }
    return {
      height: head + best.tall,
      draw: (x, y) => {
        drawHead(x, y);
        [items.slice(0, best.index), items.slice(best.index)].forEach((column, c) => {
          let at = y + head;
          const cx = x + c * (subWidth + 28);
          for (const item of column) {
            drawBox(ctx, cx, at + ITEM_PAD + 1, BOX);
            setFont(ctx, ITEM_FONT, COLOR.ink);
            item.lines.forEach((line, index) =>
              ctx.fillText(line, cx + BOX + 14, at + ITEM_PAD + 22 + index * ITEM_LINE),
            );
            at += heightOf(item);
          }
        });
      },
    };
  }

  // Final: una fila por agrupación con cuatro casillas, del 1.º al 4.º
  const nameW = width - PRIZE_W * PRIZES.length - 16;
  const rows = section.groups.map((group) => {
    ctx.font = `700 22px ${SANS}`;
    const name = wrap(ctx, group.nombre, nameW).slice(0, 2);
    return { name, author: titleCase(group.autor) };
  });
  return {
    height: head + 40 + rows.length * PRIZE_ROW,
    draw: (x, y) => {
      drawHead(x, y);
      let at = y + head;
      const prizesX = x + width - PRIZE_W * PRIZES.length;
      setFont(ctx, `700 17px ${SANS}`, COLOR.muted);
      ctx.fillText("AGRUPACIÓN", x, at + 24);
      PRIZES.forEach((prize, index) => {
        ctx.textAlign = "center";
        ctx.fillText(prize, prizesX + index * PRIZE_W + PRIZE_W / 2, at + 24);
        ctx.textAlign = "left";
      });
      ctx.fillStyle = COLOR.ink;
      ctx.fillRect(x, at + 34, width, 2.4);
      at += 40;
      for (const row of rows) {
        setFont(ctx, `700 22px ${SANS}`, COLOR.ink);
        row.name.forEach((line, index) => ctx.fillText(line, x, at + 28 + index * 26));
        setFont(ctx, `400 17px ${SANS}`, COLOR.muted);
        let author = row.author;
        while (author.length > 1 && ctx.measureText(author).width > nameW) author = author.slice(0, -1);
        ctx.fillText(
          author === row.author ? author : `${author.trimEnd()}…`,
          x,
          at + 28 + row.name.length * 26 - 4,
        );
        PRIZES.forEach((_, index) =>
          drawBox(ctx, prizesX + index * PRIZE_W + (PRIZE_W - 34) / 2, at + (PRIZE_ROW - 34) / 2, 34),
        );
        ctx.fillStyle = COLOR.rule;
        ctx.fillRect(x, at + PRIZE_ROW - 2, width, 1.5);
        at += PRIZE_ROW;
      }
    },
  };
}

/** El recuadro «Recuerda», centrado en su columna. */
function rememberBlock(ctx: Ctx, text: string, width: number): Block {
  const inner = Math.min(width, 460) - 56;
  ctx.font = `400 21px ${SANS}`;
  const lines = wrap(ctx, text, inner);
  const height = 24 + 34 + lines.length * 28 + 20;
  return {
    height: height + 20,
    draw: (x, y) => {
      const w = Math.min(width, 460);
      const left = x + (width - w) / 2;
      const top = y + 20;
      ctx.lineWidth = 3;
      ctx.strokeStyle = COLOR.violet;
      ctx.beginPath();
      ctx.roundRect(left + 1.5, top + 1.5, w - 3, height - 3, 14);
      ctx.stroke();
      ctx.textAlign = "center";
      setFont(ctx, `800 24px ${SERIF}`, COLOR.violet);
      ctx.textAlign = "center";
      ctx.fillText("RECUERDA", left + w / 2, top + 42);
      setFont(ctx, `400 21px ${SANS}`, COLOR.ink);
      ctx.textAlign = "center";
      lines.forEach((line, index) => ctx.fillText(line, left + w / 2, top + 80 + index * 28));
      ctx.textAlign = "left";
    },
  };
}

/**
 * Dibuja el cartel. Con `paper: "white"` (el PDF) no pinta el fondo crema: las
 * bandas, la cinta y el pie van en color, y el resto se queda en papel blanco.
 */
export function renderPorraCanvas(
  porra: Porra,
  { paper, zoom }: { paper: "cream" | "white"; zoom: number },
): HTMLCanvasElement {
  const prizes = porra.kind === "prizes";
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new Error("Canvas no disponible");

  const W = PORRA_WIDTH / zoom;
  const innerW = W - PAD * 2;
  const colW = (innerW - COLUMN_GAP) / 2;
  const SECTION_GAP = 36;
  // Las modalidades se reparten en dos columnas con el reparto que deja la más alta lo más baja posible
  const heights = porra.sections.map(
    (section) => sectionBlock(measure, section, prizes, colW).height + SECTION_GAP,
  );
  const noteH = rememberBlock(measure, porra.remember, colW).height;
  let cut = { index: porra.sections.length, tall: Infinity };
  for (let index = 0; index <= porra.sections.length; index++) {
    const leftH = heights.slice(0, index).reduce((sum, h) => sum + h, 0);
    const rightH = heights.slice(index).reduce((sum, h) => sum + h, 0) + noteH;
    if (Math.max(leftH, rightH) < cut.tall) cut = { index, tall: Math.max(leftH, rightH) };
  }
  const left = porra.sections.slice(0, cut.index);
  const right = porra.sections.slice(cut.index);
  // Los bloques miden con el contexto que luego los pinta: se montan una vez con
  // el de medida (para saber el alto del lienzo) y otra con el definitivo
  const build = (target: Ctx): Block[][] => [
    left.map((section) => sectionBlock(target, section, prizes, colW)),
    [
      ...right.map((section) => sectionBlock(target, section, prizes, colW)),
      rememberBlock(target, porra.remember, colW),
    ],
  ];
  let columns = build(measure);
  const columnHeight = (blocks: Block[]) =>
    blocks.reduce((sum, block) => sum + block.height, 0) + SECTION_GAP * Math.max(0, blocks.length - 1);
  const boardH = Math.max(...columns.map(columnHeight));

  const HEAD_H = 300;
  const FILL_H = 96;
  const FOOT_H = 64;
  const contentH = PAD + HEAD_H + FILL_H + boardH + 48 + FOOT_H;
  const height = Math.max(PORRA_MIN_HEIGHT / zoom, contentH);

  const canvas = document.createElement("canvas");
  canvas.width = PORRA_WIDTH * SCALE;
  canvas.height = Math.round(height * zoom * SCALE);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.scale(SCALE * zoom, SCALE * zoom);
  columns = build(ctx);

  ctx.fillStyle = paper === "cream" ? COLOR.paper : COLOR.white;
  ctx.fillRect(0, 0, W, height);

  // ---- Cabecera: confeti, antifaz, sello, «PORRA», pregunta y cinta ----
  const headTop = PAD;
  for (const { x, y, r, c } of CONFETTI) {
    ctx.save();
    ctx.translate(PAD + (x / 100) * innerW, headTop + (y / 100) * HEAD_H);
    ctx.rotate((r * Math.PI) / 180);
    ctx.fillStyle = COLOR.confetti[c - 1];
    ctx.fillRect(-14, -5, 28, 10);
    ctx.restore();
  }
  drawMask(ctx, PAD + 24, headTop + 30, 150);
  drawStamp(ctx, W - PAD - 90, headTop + 96, 150);

  const mid = W / 2;
  ctx.textAlign = "left";
  setFont(ctx, `700 24px ${SERIF}`, COLOR.cobalt);
  const season = `COAC ${SEASON.year}`;
  const seasonW = spacedWidth(ctx, season, 2);
  spaced(ctx, season, mid - seasonW / 2, headTop + 40, 2);
  ctx.fillRect(mid - seasonW / 2 - 24 - 56, headTop + 33, 56, 2.4);
  ctx.fillRect(mid + seasonW / 2 + 24, headTop + 33, 56, 2.4);

  setFont(ctx, `900 112px ${SERIF}`, COLOR.ink);
  const title = "PORRA";
  const titleW = spacedWidth(ctx, title, 7);
  spaced(ctx, title, mid - titleW / 2, headTop + 148, 7);

  setFont(ctx, `italic 700 44px ${SERIF}`, COLOR.violet);
  ctx.textAlign = "center";
  ctx.fillText(porra.question, mid, headTop + 205);

  setFont(ctx, `800 20px ${SANS}`, COLOR.white);
  const ribbon = porra.ribbon.toUpperCase();
  const ribbonW = spacedWidth(ctx, ribbon, 1.4);
  const rw = ribbonW + 110;
  const rx = mid - rw / 2;
  const ry = headTop + 232;
  const rh = 46;
  ctx.fillStyle = COLOR.cobalt;
  ctx.beginPath();
  ctx.moveTo(rx, ry);
  ctx.lineTo(rx + rw, ry);
  ctx.lineTo(rx + rw - 20, ry + rh / 2);
  ctx.lineTo(rx + rw, ry + rh);
  ctx.lineTo(rx, ry + rh);
  ctx.lineTo(rx + 20, ry + rh / 2);
  ctx.closePath();
  ctx.fill();
  setFont(ctx, `800 20px ${SANS}`, COLOR.white);
  spaced(ctx, ribbon, mid - ribbonW / 2, ry + 31, 1.4);

  // ---- Nombre y aciertos, a boli ----
  const fillY = headTop + HEAD_H + 44;
  setFont(ctx, `800 22px ${SANS}`, COLOR.ink);
  const half = innerW * 0.6;
  for (const [label, x, w] of [
    ["NOMBRE:", PAD, half - 40],
    ["ACIERTOS:", PAD + half, innerW - half],
  ] as const) {
    setFont(ctx, `800 22px ${SANS}`, COLOR.ink);
    spaced(ctx, label, x, fillY, 1);
    const labelW = spacedWidth(ctx, label, 1) + 14;
    ctx.save();
    ctx.setLineDash([2, 7]);
    ctx.lineCap = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLOR.ink;
    ctx.beginPath();
    ctx.moveTo(x + labelW, fillY + 4);
    ctx.lineTo(x + w, fillY + 4);
    ctx.stroke();
    ctx.restore();
  }

  // ---- Las modalidades, en dos columnas con una línea entre ellas ----
  const boardTop = headTop + HEAD_H + FILL_H;
  columns.forEach((blocks, index) => {
    let at = boardTop;
    const x = PAD + index * (colW + COLUMN_GAP);
    for (const block of blocks) {
      block.draw(x, at);
      at += block.height + SECTION_GAP;
    }
  });
  ctx.fillStyle = COLOR.rule;
  ctx.fillRect(W / 2 - 0.75, boardTop, 1.5, boardH);

  // ---- Pie: franja marino a sangre ----
  const footY = height - FOOT_H;
  ctx.fillStyle = COLOR.ink;
  ctx.fillRect(0, footY, W, FOOT_H);
  setFont(ctx, `700 22px ${SERIF}`, COLOR.paper);
  ctx.textAlign = "left";
  spaced(ctx, `¿Quién canta hoy? · COAC ${SEASON.year}`, PAD, footY + 41, 0.9);
  const site = "coac.com.es";
  spaced(ctx, site, W - PAD - spacedWidth(ctx, site, 0.9), footY + 41, 0.9);

  return canvas;
}
