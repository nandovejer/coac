import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Plugin } from "vite";
import { SiteHeader } from "./src/components/layout/SiteHeader";
import { SEASON, rawSessions, scheduleConfig, sessions } from "./src/config/season";
import { SITE } from "./src/config/site";
import { getSessionStart } from "./src/domain/schedule";
import { validateSessions } from "./src/domain/validate";
import { formatLongDate, formatSessionTitleDate, formatZonedIso, sortSessionDates } from "./src/lib/dates";
import { PHASES, isHomePhase } from "./src/variants/phases";
import { NEW_GROUP_LABEL } from "./src/types";

/**
 * Genera en cada build (a partir de `season.ts` y el JSON de la fase, las
 * mismas fuentes que usa la app en cliente) todo lo que un crawler sin
 * JavaScript necesita: contenido HTML real dentro de #root, metadatos
 * (title/description/canonical/OG/Twitter; por eso `index.html` no los lleva) y
 * datos estructurados JSON-LD.
 * React sustituye este contenido al arrancar (createRoot, no hidratación),
 * así que no hay riesgo de mismatch.
 */
// Aplica el modo de color guardado (o el del sistema) antes del primer pintado,
// para que quien use oscuro no vea un destello de modo claro.
function themeBootScript(): string {
  const packageJson = createRequire(import.meta.url).resolve("@luz-ds/core/package.json");
  const file = join(dirname(packageJson), "dist", "theme-boot.min.js");
  // Un "</script" dentro del script cerraría la etiqueta antes de tiempo.
  return readFileSync(file, "utf8").trim().replaceAll("</script", "<\\/script");
}

export default function seoPlugin(): Plugin[] {
  const seo: Plugin = {
    name: "coac-seo",
    buildStart() {
      // Un JSON mal escrito rompe el build, no la web.
      const errors = validateSessions(rawSessions, SEASON.previousYear);
      if (errors.length > 0) {
        this.error(`Datos de la fase inválidos:\n - ${errors.join("\n - ")}`);
      }
    },
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        let result = html.replace(/<title>[\s\S]*?<\/title>/, "");
        // Orden del <head>: charset primero (tiene que caer en los primeros 1024 bytes),
        // el modo de color antes del primer pintado y, después, los metadatos
        result = result.replace(/<meta charset="UTF-8" \/>\s*/, "");
        result = result.replace(
          "<head>",
          `<head>\n    <meta charset="UTF-8" />\n    <script>${themeBootScript()}</script>`,
        );
        result = result.replace("</head>", `${buildHeadTags()}\n  </head>`);
        // Los datos estructurados no son para el primer pintado: al final del body
        result = result.replace(
          "</body>",
          `  <script type="application/ld+json">${buildJsonLd()}</script>\n  </body>`,
        );
        result = result.replace(
          /<div id="root">[\s\S]*?<\/div>/,
          `<div id="root">${buildStaticContent()}</div>`,
        );
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

function pageTitle(): string {
  return `¿Quién canta hoy en el COAC ${SEASON.year}? Orden de actuación y horarios`;
}

function pageDescription(): string {
  return `Qué agrupaciones cantan hoy en el COAC ${SEASON.year} (${SEASON.phaseTitle.toLowerCase()}) en el ${SITE.venue}, el Carnaval de Cádiz: orden de actuación y horarios estimados. Web no oficial.`;
}

const OG_IMAGE_ALT =
  "Dos máscaras de teatro sobre fondo azul oscuro y el título «¿Quién canta hoy en el COAC?», con el lema «Horario de sesiones · agrupaciones · directo».";

function buildHeadTags(): string {
  const title = escapeHtml(pageTitle());
  const description = escapeHtml(pageDescription());
  const ogImage = `${SITE.url}og-image.png`;
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
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${imageAlt}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
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
  const ogImage = `${SITE.url}og-image.png`;

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
        url: SITE.url,
        inLanguage: "es",
      },
      ...events,
    ],
  };

  // Escapamos "<" para que un valor con "</script>" no rompa el documento.
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}

function buildStaticContent(): string {
  const data = sessions;
  const dates = sortSessionDates(Object.keys(data));

  const sessionsHtml = dates
    .map((date) => {
      const groups = data[date];

      const itemsHtml = groups
        .map((group) => {
          const previousHtml = group.previous
            ? `<p>${"isNew" in group.previous ? NEW_GROUP_LABEL : `Anteriormente: ${escapeHtml(group.previous.name)}`}</p>`
            : "";

          return `
            <li id="${escapeHtml(group.id)}" class="coac-static__item">
              <span class="coac-static__modalidad">${escapeHtml(group.modalidad)}</span>
              — <strong class="coac-static__author">${escapeHtml(group.autor)}</strong>
              <p>${escapeHtml(group.nombre)}</p>
              <p class="coac-static__city">${escapeHtml(group.ciudad)}</p>
              ${previousHtml}
            </li>`;
        })
        .join("");

      return `
        <section aria-labelledby="seo-${escapeHtml(date.replace(/\//g, "-"))}" class="coac-static__session">
          <h2 id="seo-${escapeHtml(date.replace(/\//g, "-"))}" class="coac-static__title coac-gradient-heading">
            Sesión — ${escapeHtml(formatLongDate(date))}
          </h2>
          <ul class="coac-static__list">${itemsHtml}</ul>
        </section>`;
    })
    .join("");

  // La misma cabecera que la app, para que React no la "mueva" al arrancar.
  const headerHtml = renderToStaticMarkup(
    createElement(SiteHeader, { year: SEASON.year, phaseTitle: SEASON.phaseTitle }),
  );

  return `
    ${headerHtml}
    <main id="siteMain">${sessionsHtml}</main>
    <footer>
      <p>
        Web no oficial, hecha por un aficionado. No tiene relación con el Ayuntamiento de Cádiz ni con la
        organización del COAC. El listado y el orden de actuación proceden de la información pública del
        Ayuntamiento; las horas son estimadas y las recomendaciones, personales.
      </p>
    </footer>`;
}
