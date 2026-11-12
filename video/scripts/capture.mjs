// Graba la app real, fotograma a fotograma, para el tráiler.
// Uso: node video/scripts/capture.mjs <url de la app> <carpeta de salida>
// La app se abre a 360 × 640 (× 3 = 1080 × 1920) con el reloj parado en una
// noche de sesión y «reducir movimiento», para que cada captura sea un estado
// estable. Escribe los PNG, `take.txt` (lista para ffmpeg concat) y
// `take.json` (tiempos y cajas de lo que la cámara del vídeo va a enfocar).
import { chromium } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";

const [url, out] = process.argv.slice(2);
const FPS = 30;
// Viernes 8 de enero de 2027, 21:10 en Cádiz: canta la segunda agrupación.
const NOW = new Date("2027-01-08T21:10:00+01:00");
const QUERY = "Jona";

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 360, height: 640 },
  deviceScaleFactor: 3,
  locale: "es-ES",
  timezoneId: "Europe/Madrid",
  isMobile: true,
  hasTouch: true,
  reducedMotion: "reduce",
});
const page = await context.newPage();
await page.clock.install({ time: NOW });
await page.goto(url);
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Lo entiendo" }).click();
await page.waitForTimeout(400);

const frames = []; // { file, frames }
const marks = {};
const boxes = {};
let n = 0;
let total = 0;
const settle = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
async function shot(hold = 1) {
  await settle();
  const file = `f${String(n++).padStart(4, "0")}.png`;
  await page.screenshot({ path: `${out}/${file}` });
  frames.push({ file, frames: hold });
  total += hold;
}
const mark = (name) => (marks[name] = total / FPS);
const box = async (name, locator) => (boxes[name] = await locator.first().boundingBox());
const seconds = (s) => Math.round(s * FPS);

// Baja con suavizado, un fotograma por paso, hasta dejar `slot` bajo el filtro fijo.
// La cabecera se esconde al bajar y mueve el contenido: primero se salta al
// destino para medir dónde queda de verdad, se corrige y se vuelve al origen.
const UNDER_FILTERS = 196;
async function scrollToSlot(slot, duration) {
  const start = await page.evaluate(() => window.scrollY);
  let end = (await pageTop(slot)) - UNDER_FILTERS;
  for (let pass = 0; pass < 2; pass++) {
    await page.evaluate((y) => window.scrollTo(0, y), end);
    await settle();
    end += Math.round((await slot.first().boundingBox()).y - UNDER_FILTERS);
  }
  await page.evaluate((y) => window.scrollTo(0, y), start);
  await settle();
  const steps = seconds(duration);
  for (let i = 1; i <= steps; i++) {
    const p = i / steps;
    const eased = p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(start + (end - start) * eased));
    await shot(1);
  }
}
const pageTop = (locator) => locator.first().evaluate((el) => Math.round(el.getBoundingClientRect().top + window.scrollY));

// 1. Arriba: quién canta ahora (3 s).
mark("top");
await box("liveCard", page.locator(".coac-app__status"));
await shot(seconds(3));

// 2. Bajar hasta el programa: la tarjeta «Actuando ahora» queda bajo el filtro (1,6 s + 2,4 s).
const liveNow = page.locator(".coac-app__slot", { has: page.locator(".coac-app__live-bar") });
mark("scroll");
await scrollToSlot(liveNow, 1.6);
mark("programme");
await box("nowCard", liveNow);
await box("nowTime", liveNow.locator(".coac-app__time"));
await shot(seconds(2.4));

// 3. Modos de color con el botón real de Luz: oscuro, alto contraste y de vuelta (1 s cada uno).
const mode = page.locator("luz-theme-mode .luz-theme-mode__button");
await box("modeButton", mode);
for (const name of ["dark", "contrast", "light"]) {
  await mode.click();
  await page.waitForTimeout(350);
  mark(name);
  await shot(seconds(name === "light" ? 0.5 : 1));
}

// 4. Buscar a un autor, letra a letra (0,2 s por tecla), y bajar al resultado.
const search = page.locator("#coac-search");
await search.focus();
await page.waitForTimeout(300);
mark("focus");
await box("search", search);
await shot(seconds(0.5));
for (let i = 1; i <= QUERY.length; i++) {
  await search.fill(QUERY.slice(0, i));
  await page.waitForTimeout(350);
  mark(`key${i}`);
  await shot(i < QUERY.length ? seconds(0.2) : seconds(0.9));
}
const result = page.locator(".coac-app__slot", { hasText: "Las cloacas" });
mark("toResult");
await scrollToSlot(result, 1);
mark("result");
await box("result", result);
await box("resultTime", result.locator(".coac-app__time"));
await box("searchPinned", search);
boxes.resultText = await result.innerText();
await shot(seconds(3));

writeFileSync(`${out}/take.txt`, frames.map((f) => `file '${f.file}'\nduration ${(f.frames / FPS).toFixed(6)}`).join("\n") + `\nfile '${frames.at(-1).file}'\n`);
writeFileSync(`${out}/take.json`, JSON.stringify({ fps: FPS, seconds: total / FPS, marks, boxes }, null, 2));
console.log(JSON.stringify({ seconds: total / FPS, marks, boxes }, null, 2));
await browser.close();
