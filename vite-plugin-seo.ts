import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { createServer, type Plugin, type ResolvedConfig } from "vite";
import { SEASON, rawSessions, scheduleConfig, sessions } from "./src/config/season";
import { SITE } from "./src/config/site";
import { getSessionStart } from "./src/domain/schedule";
import { validateSessions } from "./src/domain/validate";
import {
  formatSessionTitleDate,
  formatZonedIso,
  getZonedParts,
  sortSessionDates,
  zonedTimeToInstant,
} from "./src/lib/dates";
import { PHASES, isHomePhase } from "./src/domain/phases";

/**
 * Genera en cada build (a partir de `season.ts` y el JSON de la fase, las
 * mismas fuentes que usa la app en cliente) todo lo que un crawler sin
 * JavaScript, y el primer pintado, necesitan: la propia app (src/app/App.tsx)
 * prerenderizada dentro de #root, metadatos (title/description/canonical/OG/
 * Twitter; por eso `index.html` no los lleva) y datos estructurados JSON-LD.
 * React sustituye el contenido de #root al arrancar (createRoot, no
 * hidratación), así que no hay mismatch ni hace falta que coincida al detalle.
 */
// Aplica el modo de color guardado (o el del sistema) antes del primer pintado,
// para que quien use oscuro no vea un destello de modo claro.
function themeBootScript(): string {
  const packageJson = createRequire(import.meta.url).resolve("@luz-ds/core/package.json");
  const file = join(dirname(packageJson), "dist", "theme-boot.min.js");
  // Un "</script" dentro del script cerraría la etiqueta antes de tiempo.
  return readFileSync(file, "utf8").trim().replaceAll("</script", "<\\/script");
}

/** Fecha `yyyy-mm-dd` de hoy en `SITE.timeZone` a partir de un instante. */
function zonedDay(instant: Date): string {
  const { year, month, day } = getZonedParts(instant, SITE.timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Hora que se usa al prerenderizar: el mediodía (hora de Madrid) del día del build.
 * Así «Hoy», «Mañana», «Celebrada» y el orden son correctos todo el día, y ninguna
 * actuación sale empezada (las sesiones empiezan por la tarde).
 */
function prerenderNow(): Date {
  // `COAC_PRERENDER_DATE=2027-01-12` fija el día (para probar un build como si fuera ese día)
  const fixed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(process.env.COAC_PRERENDER_DATE ?? "");
  const { year, month, day } = fixed
    ? { year: Number(fixed[1]), month: Number(fixed[2]), day: Number(fixed[3]) }
    : getZonedParts(new Date(), SITE.timeZone);
  return zonedTimeToInstant({ year, month, day }, 12, 0, SITE.timeZone);
}

/**
 * Script en línea del <head>, antes del primer pintado:
 * - Guarda si el cron falla: compara la fecha del build (`<html data-built>`) con la
 *   del día de sesión de hoy (hasta `sessionEndTime` de la madrugada cuenta el día
 *   anterior) y, si difieren, pone `html[data-stale]`: el CSS esconde solo las
 *   etiquetas «Hoy» y «Mañana» hasta que monte React.
 * - Entrada de la primera carga: decide `html[data-intro]` (sin ancla, arriba, sin
 *   «reducir movimiento» y primera vez en la pestaña) para que la fachada espere en
 *   su pose inicial; la app lo lee, anima y lo suelta.
 */
function bootScript(): string {
  const [endHour, endMinute] = SEASON.sessionEndTime.split(":").map(Number);
  const endMs = (endHour * 60 + endMinute) * 60000;
  return (
    "(()=>{try{const h=document.documentElement;" +
    `const d=new Intl.DateTimeFormat("en-CA",{timeZone:${JSON.stringify(SITE.timeZone)}}).format(new Date(Date.now()-${endMs}));` +
    'if(h.dataset.built&&h.dataset.built!==d)h.setAttribute("data-stale","");' +
    'if(!location.hash&&!scrollY&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&sessionStorage.getItem("coac-intro")!=="1")h.setAttribute("data-intro","")' +
    "}catch(e){}})()"
  );
}

/**
 * Script en línea justo tras la tira de días, antes del primer pintado: quita las
 * flechas si todos los días caben y deja a la vista el día de hoy (o el próximo), como
 * hace DayStrip al montar. Así la tira no se mueve cuando React toma el relevo.
 */
const DAY_STRIP_SCRIPT =
  "(()=>{try{const c=document.querySelector('.coac-app__carousel');const l=c&&c.querySelector('.coac-app__days');if(!l)return;" +
  "c.removeAttribute('data-scrollable');if(l.scrollWidth>l.clientWidth+1)c.setAttribute('data-scrollable','');" +
  "const d=l.querySelector('[data-label=\"Hoy\"]')||l.querySelector('[data-upcoming]')||l.querySelector('li:last-child button');if(!d)return;" +
  "const a=l.getBoundingClientRect(),b=d.getBoundingClientRect();if(b.left>=a.left&&b.right<=a.right)return;" +
  "l.scrollTo({left:b.left-a.left+l.scrollLeft-(a.width-b.width)/2,behavior:'instant'})}catch(e){}})()";

export default function seoPlugin(): Plugin[] {
  let config: ResolvedConfig;

  /**
   * Pinta la app en HTML. Se carga con un servidor de Vite en modo middleware y
   * `ssrLoadModule`: con la misma configuración que el build (alias del modo e2e,
   * JSON, `import.meta.env`), que esbuild al leer `vite.config.ts` no tiene.
   */
  async function prerender(now: Date): Promise<string> {
    // El servidor de Vite compila el JSX en modo desarrollo (`jsxDEV`) y React, que
    // se carga fuera de Vite, tiene que ser el de desarrollo para ofrecerlo: en el
    // build `NODE_ENV` es `production` y no lo trae. Se restaura al terminar.
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const server = await createServer({
      configFile: config.configFile,
      mode: config.mode,
      root: config.root,
      logLevel: "error",
      appType: "custom",
      server: { middlewareMode: true, hmr: false, watch: null },
      optimizeDeps: { noDiscovery: true },
    });
    try {
      const entry = await server.ssrLoadModule("/src/prerender.tsx");
      const html = (entry.renderApp as (now: Date) => string)(now);
      // La tira de días se ajusta antes del primer pintado, no al montar React
      return html.replace(
        /<nav class="coac-app__calendar"[\s\S]*?<\/nav>/,
        (nav) => `${nav}<script>${DAY_STRIP_SCRIPT}</script>`,
      );
    } finally {
      await server.close();
      if (previousEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousEnv;
    }
  }

  const seo: Plugin = {
    name: "coac-seo",
    configResolved(resolved) {
      config = resolved;
    },
    buildStart() {
      // Un JSON mal escrito rompe el build, no la web.
      const errors = validateSessions(rawSessions, SEASON.previousYear);
      if (errors.length > 0) {
        this.error(`Datos de la fase inválidos:\n - ${errors.join("\n - ")}`);
      }
    },
    transformIndexHtml: {
      order: "pre",
      async handler(html, ctx) {
        let result = html.replace(/<title>[\s\S]*?<\/title>/, "");
        // Orden del <head>: charset primero (tiene que caer en los primeros 1024 bytes),
        // el modo de color antes del primer pintado y, después, los metadatos
        result = result.replace(/<meta charset="UTF-8" \/>\s*/, "");
        result = result.replace(
          "<head>",
          `<head>\n    <meta charset="UTF-8" />\n    <script>${themeBootScript()}</script>\n    <script>${bootScript()}</script>`,
        );
        // Fecha del build, para la guarda de `bootScript` (solo si hay prerender)
        const prerendered = !ctx.server;
        if (prerendered) {
          result = result.replace("<html ", `<html data-built="${zonedDay(prerenderNow())}" `);
        }
        result = result.replace("</head>", `${buildHeadTags()}\n  </head>`);
        // Los datos estructurados no son para el primer pintado: al final del body
        result = result.replace(
          "</body>",
          `  <script type="application/ld+json">${buildJsonLd()}</script>\n  </body>`,
        );
        // En desarrollo #root va vacío (Vite sirve el módulo y React pinta); en el build,
        // la app entera
        if (prerendered) {
          const app = await prerender(prerenderNow());
          result = result.replace('<div id="root"></div>', () => `<div id="root">${app}</div>`);
        }
        return result;
      },
    },
    generateBundle() {
      const lastmod = new Date().toISOString().slice(0, 10);
      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        "  <url>",
        `    <loc>${SITE.url}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        "    <changefreq>daily</changefreq>",
        "  </url>",
        "</urlset>",
        "",
      ].join("\n");

      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap });
    },
  };

  // El CSS bloquea el primer pintado: en línea se ahorra un viaje de red.
  // Solo en build; en dev no hay bundle y Vite inyecta los estilos.
  const inlineCss: Plugin = {
    name: "coac-inline-css",
    enforce: "post",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const bundle = ctx.bundle;
        if (!bundle) return html;
        return html.replace(
          /<link rel="stylesheet"[^>]*href="[^"]*\/(assets\/[^"]+\.css)"[^>]*>/g,
          (tag, fileName: string) => {
            const asset = bundle[fileName];
            if (asset?.type !== "asset") return tag;
            // Un "</style" dentro del CSS cerraría la etiqueta antes de tiempo.
            const css = String(asset.source).trim().replaceAll("</style", "<\\/style");
            delete bundle[fileName];
            return `<style>${css}</style>`;
          },
        );
      },
    },
  };

  return [seo, inlineCss];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// «No oficial» va en el título y al principio de la descripción: Google corta
// el título hacia los 600 px y la descripción hacia los 155 caracteres, y por
// el final. Este título mide ~585 px en Arial 20 px.
function pageTitle(): string {
  return `¿Quién canta hoy en el COAC ${SEASON.year}? Orden y horarios (no oficial)`;
}

function pageDescription(): string {
  return `Web no oficial con el orden de actuación y los horarios estimados del COAC ${SEASON.year} (${SEASON.phaseTitle.toLowerCase()}) en el ${SITE.venue}, Carnaval de Cádiz.`;
}

const UNOFFICIAL_NOTICE =
  "Web no oficial, hecha por un aficionado. No tiene relación con el Ayuntamiento de Cádiz ni con la organización del COAC.";

// Imagen para compartir: JPEG de 1200 × 630 (1,91:1, lo que recortan Facebook y X)
// y menos de 300 kB, que WhatsApp no siempre enseña imágenes más pesadas. Sale de
// src/assets/cardseo-optima.png (1536 × 1024): filas 114–920, reducida a 1200 × 630,
// JPEG calidad 88. Nombra la fase («preliminares»): al cambiar de fase hay que
// rehacerla y cambiar este texto.
const OG_IMAGE = `${SITE.url}og-image.jpg`;
const OG_IMAGE_ALT =
  "Cartel con el título «¿Quién canta hoy en el Falla?» y el texto «Aunque no seamos la web oficial, puedes ver los horarios de las preliminares del COAC».";

function buildHeadTags(): string {
  const title = escapeHtml(pageTitle());
  const description = escapeHtml(pageDescription());
  const ogImage = OG_IMAGE;
  const imageAlt = escapeHtml(OG_IMAGE_ALT);

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="max-image-preview:large" />`,
    `<link rel="canonical" href="${SITE.url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="es_ES" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE.name)}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${SITE.url}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:image:secure_url" content="${ogImage}" />`,
    `<meta property="og:image:type" content="image/jpeg" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${imageAlt}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:creator" content="${SITE.authorX}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    `<meta name="twitter:image:alt" content="${imageAlt}" />`,
  ].join("\n    ");
}

function buildJsonLd(): string {
  const data = sessions;
  const dates = sortSessionDates(Object.keys(data));
  const phaseShort = PHASES.find(isHomePhase)?.short ?? SEASON.phaseTitle;
  const ogImage = OG_IMAGE;

  const events = dates.map((date) => {
    const groups = data[date];
    const start = getSessionStart(date, scheduleConfig.sessionStartTime, scheduleConfig.timeZone);
    const end = new Date(start.getTime() + groups.length * SEASON.minutesPerGroup * 60000);
    const sessionDay = formatSessionTitleDate(date);
    const lineup = groups.map((group, index) => `${index + 1}. ${group.nombre}`).join("; ");

    return {
      "@type": "Event",
      name: `COAC ${SEASON.year} · ${phaseShort} · Sesión del ${sessionDay.charAt(0).toLowerCase()}${sessionDay.slice(1)}`,
      description: `Orden de actuación: ${lineup}. Horas estimadas, ${SEASON.minutesPerGroup} minutos por agrupación.`,
      image: ogImage,
      // Hora de Madrid con su desfase, no UTC: lo que se lee es lo que pasa
      startDate: formatZonedIso(start, scheduleConfig.timeZone),
      endDate: formatZonedIso(end, scheduleConfig.timeZone),
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
      location: [
        {
          "@type": "Place",
          name: SITE.venue,
          address: {
            "@type": "PostalAddress",
            streetAddress: SITE.venueStreet,
            postalCode: SITE.venuePostalCode,
            addressLocality: SITE.city,
            addressRegion: SITE.city,
            addressCountry: "ES",
          },
        },
        {
          "@type": "VirtualLocation",
          url: SEASON.liveUrl,
        },
      ],
      performer: groups.map((group) => ({
        "@type": "PerformingGroup",
        name: group.nombre,
        description: [group.modalidad, group.autor].filter(Boolean).join(" — "),
      })),
      url: `${SITE.url}#${date}`,
    };
  });

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE.name,
        alternateName: "Quién canta hoy en el COAC",
        description: UNOFFICIAL_NOTICE,
        url: SITE.url,
        inLanguage: "es",
      },
      ...events,
    ],
  };

  // Escapamos "<" para que un valor con "</script>" no rompa el documento.
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}
