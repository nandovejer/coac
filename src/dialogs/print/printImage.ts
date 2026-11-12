import { SEASON } from "../../config/season";
import { formatSessionTitleDate } from "../../lib/dates";
import { actOrder, capitalize } from "./format";
import type { PrintBlock } from "./PrintSheet";

/**
 * Dibuja el horario en un canvas y lo devuelve como PNG. Sin librerías: texto
 * y líneas a mano, con el mismo orden y semáforo (círculo / anillo) que la hoja.
 * 1080 px de ancho: se lee bien en el móvil y se comparte sin pesar mucho.
 */
const WIDTH = 1080;
const PAD = 56;
const ROW = 76;
const SESSION_HEAD = 74;
const HEAD = 170;
const FOOT = 70;
const ORDER_COL = 70;
const MOD_COL = 210;

const INK = "#111111";
const MUTED = "#4b4b4b";
const LINE = "#c8c8c8";
const MARK = { top: "#15803d", ok: "#a16207" } as const;
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Recorta con «…» para que el texto quepa en `max` píxeles. */
function fit(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > max) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

/** Semáforo con forma: círculo lleno (imprescindible) o anillo (recomendada). */
function drawMark(ctx: CanvasRenderingContext2D, ranking: "top" | "ok", cx: number, cy: number) {
  ctx.beginPath();
  if (ranking === "top") {
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = MARK.top;
    ctx.fill();
  } else {
    ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = MARK.ok;
    ctx.stroke();
  }
}

const titleCase = (text: string) => text.toLowerCase().replace(/(^|[\s'(-])\p{L}/gu, (c) => c.toUpperCase());

export function renderScheduleImage(blocks: PrintBlock[]): Promise<Blob> {
  const rows = blocks.reduce((total, block) => total + block.rows.length, 0);
  const height = PAD + HEAD + blocks.length * SESSION_HEAD + rows * ROW + FOOT + PAD;
  const scale = 2; // nítido en pantallas de alta densidad

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas no disponible"));
  ctx.scale(scale, scale);
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, height);

  // Cabecera
  let y = PAD;
  ctx.fillStyle = MUTED;
  ctx.font = `700 22px ${FONT}`;
  ctx.fillText(`¿QUIÉN CANTA HOY? · COAC ${SEASON.year}`, PAD, y + 22);
  ctx.fillStyle = INK;
  ctx.font = `800 44px ${FONT}`;
  ctx.fillText(fit(ctx, `Mi horario · ${SEASON.phaseTitle}`, WIDTH - PAD * 2), PAD, y + 80);
  ctx.fillStyle = MUTED;
  ctx.font = `400 22px ${FONT}`;
  const note = "Por orden de actuación.";
  ctx.fillText(note, PAD, y + 122);
  let x = PAD + ctx.measureText(note).width + 18;
  for (const [ranking, label] of [
    ["top", "Imprescindible"],
    ["ok", "Recomendada"],
  ] as const) {
    drawMark(ctx, ranking, x + 8, y + 115);
    x += 28;
    ctx.fillStyle = MUTED;
    ctx.fillText(label, x, y + 122);
    x += ctx.measureText(label).width + 22;
  }
  y += HEAD;
  ctx.fillStyle = INK;
  ctx.fillRect(PAD, y - 26, WIDTH - PAD * 2, 3);

  // Sesiones
  const nameX = PAD + ORDER_COL;
  const modX = WIDTH - PAD - MOD_COL;
  for (const { session, rows: performances } of blocks) {
    ctx.fillStyle = INK;
    ctx.font = `800 30px ${FONT}`;
    ctx.fillText(formatSessionTitleDate(session.date), PAD, y + 34);
    ctx.fillStyle = INK;
    ctx.fillRect(PAD, y + SESSION_HEAD - 14, WIDTH - PAD * 2, 2);
    y += SESSION_HEAD;

    for (const { group } of performances) {
      // Orden de actuación, alineado a la derecha de su hueco
      ctx.fillStyle = INK;
      ctx.font = `800 26px ${FONT}`;
      const order = String(actOrder(session, group));
      ctx.fillText(order, PAD + ORDER_COL - 24 - ctx.measureText(order).width, y + 30);

      let textX = nameX;
      if (group.ranking !== "standar") {
        drawMark(ctx, group.ranking, nameX + 9, y + 21);
        textX += 30;
      }
      ctx.fillStyle = INK;
      ctx.font = `700 26px ${FONT}`;
      ctx.fillText(fit(ctx, group.nombre, modX - textX - 20), textX, y + 30);
      ctx.fillStyle = MUTED;
      ctx.font = `400 21px ${FONT}`;
      ctx.fillText(fit(ctx, titleCase(group.autor), modX - nameX - 20), nameX, y + 58);

      ctx.fillStyle = INK;
      ctx.font = `400 22px ${FONT}`;
      ctx.fillText(capitalize(group.modalidad), modX, y + 30);
      ctx.fillStyle = MUTED;
      ctx.font = `400 21px ${FONT}`;
      ctx.fillText(fit(ctx, group.ciudad, MOD_COL), modX, y + 58);

      ctx.fillStyle = LINE;
      ctx.fillRect(PAD, y + ROW - 4, WIDTH - PAD * 2, 1);
      y += ROW;
    }
    y += 8;
  }

  ctx.fillStyle = MUTED;
  ctx.font = `400 20px ${FONT}`;
  ctx.fillText("coac.com.es", PAD, height - PAD);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo crear la imagen"))),
      "image/png",
    ),
  );
}
