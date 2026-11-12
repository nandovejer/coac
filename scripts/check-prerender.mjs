// Comprueba el HTML prerenderizado de dist/index.html (ver vite-plugin-seo.ts):
// que la página se lee completa sin JavaScript y que no lleva nada que cambie por
// horas. Se ejecuta tras el build: `pnpm run check:prerender`.
import { readFileSync } from "node:fs";

// Por defecto dist/index.html; otra carpeta de salida se pasa como argumento.
const html = readFileSync(process.argv[2] ?? new URL("../dist/index.html", import.meta.url), "utf8");
const season = readFileSync(new URL("../src/config/season.ts", import.meta.url), "utf8");
const dataFile = /data\/(COAC_[\w]+\.json)/.exec(season)?.[1];
const year = /year:\s*(\d{4})/.exec(season)?.[1];
const phaseTitle = /phaseTitle:\s*"([^"]+)"/.exec(season)?.[1];
const data = JSON.parse(readFileSync(new URL(`../src/data/${dataFile}`, import.meta.url), "utf8"));

const rootStart = html.indexOf('<div id="root">');
const ldStart = html.lastIndexOf('<script type="application/ld+json">');
const rootEnd = html.lastIndexOf("</div>", ldStart);
const root = html.slice(rootStart, rootEnd);

const errors = [];
const check = (ok, message) => ok || errors.push(message);
const count = (pattern, text = root) => (text.match(pattern) ?? []).length;

const dates = Object.keys(data);
const groups = dates.reduce((total, date) => total + data[date].length, 0);

check(rootStart > 0 && root.includes("coac-ve"), "#root no lleva la app prerenderizada");
check(count(/<h1[\s>]/g) === 1, "tiene que haber exactamente un h1");
const h1 = /<h1[\s\S]*?<\/h1>/.exec(root)?.[0] ?? "";
check(h1.includes(`COAC ${year}`) && h1.includes(phaseTitle), "el h1 no lleva el año y la fase");
check(count(/<h2[^>]*class="coac-ve__session-title"/g) === dates.length, "falta un h2 de sesión por fecha");
check(count(/<time datetime="\d{4}-\d{2}-\d{2}">/gi) === dates.length, "falta un <time datetime> por sesión");
for (const date of dates) check(root.includes(`id="${date}"`), `falta el id de fecha ${date}`);
check(count(/<h3[\s>]/g) === groups, `tiene que haber un h3 por agrupación (${groups})`);
const ids = [...root.matchAll(/<article class="coac-ve__card" id="([^"]+)"/g)].map((m) => m[1]);
check(ids.length === groups && new Set(ids).size === groups, "faltan ids de agrupación o están repetidos");
check(root.includes('id="siteMain"') && root.includes('id="siteHeader"'), "faltan #siteMain o #siteHeader");

// Nada que cambie por horas
const forbidden = [
  "Ya actuó",
  "Actuando ahora",
  "En directo",
  "A continuación",
  "Aún no ha empezado",
  "ya han actuado",
  "Ha terminado",
  "Empieza la sesión",
  "coac-ve__roll",
  "coac-ve__strip",
  "coac-ve__live-bar",
  "coac-privacy-notice",
];
for (const text of forbidden) check(!root.includes(text), `el prerender lleva «${text}»`);
check(!/Faltan \d+ días,/.test(root), "el prerender lleva el texto accesible de la cuenta atrás");

// Lo que sí tiene que llevar
check(root.includes("coac-ve__pending"), "faltan los marcadores «--» de la cuenta atrás");
check(
  root.includes("/THIRD-PARTY-LICENSES.txt") && root.includes("Web no oficial"),
  "falta el pie con las licencias y el aviso",
);
check(/<html[^>]*data-built="\d{4}-\d{2}-\d{2}"/.test(html), "falta data-built en <html>");
check(
  html.indexOf("<style>") > html.indexOf('property="og:image"'),
  "los metadatos tienen que ir antes del <style>",
);

// Tarjetas al compartir: lo que piden el Sharing Debugger de Facebook y X.
const head = html.slice(0, html.indexOf("</head>"));
const meta = (attr, name) => new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`).exec(head)?.[1] ?? "";
for (const name of ["og:title", "og:description", "og:url", "og:type", "og:image", "og:image:alt"])
  check(meta("property", name), `falta ${name}`);
for (const name of [
  "twitter:card",
  "twitter:title",
  "twitter:description",
  "twitter:image",
  "twitter:image:alt",
])
  check(meta("name", name), `falta ${name}`);
check(/^https:\/\//.test(meta("property", "og:image")), "og:image tiene que ser una URL https absoluta");
check(
  meta("property", "og:url") === /<link rel="canonical" href="([^"]+)"/.exec(head)?.[1],
  "og:url ≠ canonical",
);
check(
  meta("name", "twitter:card") === "summary_large_image",
  "twitter:card tiene que ser summary_large_image",
);
check(meta("name", "twitter:title").length <= 70, "twitter:title pasa de 70 caracteres");
check(meta("name", "twitter:description").length <= 200, "twitter:description pasa de 200 caracteres");
check(meta("property", "og:image:alt").length <= 420, "og:image:alt pasa de 420 caracteres");
check(
  ldStart > rootEnd && html.indexOf('"@type":"Event"', ldStart) > 0,
  "el JSON-LD tiene que ir al final del body",
);

if (errors.length > 0) {
  console.error(`check:prerender: ${errors.length} fallo(s)\n - ${errors.join("\n - ")}`);
  process.exit(1);
}
console.log(
  `check:prerender: OK (${dates.length} sesiones, ${groups} agrupaciones, ${(html.length / 1024).toFixed(0)} kB)`,
);
