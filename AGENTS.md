# ¿Quién canta hoy en el COAC?

Web estática que muestra qué agrupaciones cantan en cada sesión del COAC
(Concurso Oficial de Agrupaciones Carnavalescas de Cádiz), con horario estimado
por agrupación, buscador de autores y enlace al directo.

Vite + React 18 + TypeScript + Tailwind. Sin router, sin estado global, sin
backend: todo se sirve estático desde GitHub Pages. Comandos y cambio de fase
(3 pasos): [README.md](README.md). Plan de refactor en curso:
[.claude/plans/PLAN-OPTIMIZACION.md](.claude/plans/PLAN-OPTIMIZACION.md).

## Verificar un cambio

```bash
pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build
pnpm run test:visual   # si tocas UI: compara capturas píxel a píxel
```

`test:visual` falla ante cualquier diferencia visual. Si el cambio de aspecto es
intencionado, `pnpm run test:visual:update` y revisa las imágenes nuevas. Las
capturas son de Linux y no se ejecutan en CI.

## Reglas

- Todo el texto visible está en español. Los identificadores en inglés, salvo
  los campos del JSON (`modalidad`, `autor`, `nombre`, `ciudad`).
- **No cambies el formato ni el contenido de `src/data/COAC_*.json`** sin que
  te lo pidan: se copian del listado oficial. Si ves algo raro, avisa.
- **Zona horaria**: toda hora de sesión es `SITE.timeZone` (`Europe/Madrid`),
  nunca la del navegador ni la del build. No uses `new Date().getHours()` ni
  similares: usa `domain/schedule.ts`, que recibe `now` como parámetro.
- La app se sirve bajo `base: "/coac-quien-canta-hoy/"` (`vite.config.ts`).
- No renombres los ids del DOM (`siteHeader`, `siteMain`, `searchAuthor`,
  `session-present|future|past`, las fechas y los ids de agrupación): son
  anclas del menú y del buscador.
- No dejes dos archivos con el mismo nombre base en `.ts` y `.tsx`: esbuild
  resuelve `.tsx` primero y el build se rompió así.
- El deploy es por GitHub Actions al hacer push a `main`. No existe deploy
  manual (y `pnpm deploy` sin `run` es otro comando de pnpm).
- Si pnpm dice `ERR_PNPM_UNEXPECTED_STORE`, el `node_modules` se instaló con
  otro store: usa `pnpm install` o pasa `--store-dir` al del error.

## Modelo de datos

`src/data/COAC_<año>_<FASE>.json`: fechas de sesión `dd/mm/yyyy` →
agrupaciones **en orden de actuación**.

```json
{
  "30/01/2026": [
    {
      "ranking": "top | ok | standar",
      "modalidad": "CORO | COMPARSA | CHIRIGOTA | CUARTETO",
      "nombre": "Nombre de la agrupación",
      "autor": "Autores",
      "2025": "Agrupación del año anterior (o 'Nueva agrupación')",
      "ciudad": "Cádiz"
    }
  ]
}
```

- La clave del año anterior cambia cada año (`SEASON.previousYear`).
- Las fechas de cada sesión no se declaran en ningún otro sitio.
- Los datos solo entran en la app por `domain/loadSessions.ts` (tipado + ids).
  `domain/validate.ts` los valida en el build y en los tests;
  `src/data/coac-session.schema.json` da lo mismo en el editor.
- Las sesiones empiezan a `SEASON.sessionStartTime` y hasta
  `SEASON.sessionEndTime` de la madrugada siguiente se sigue considerando la
  sesión del día anterior.
- Las temporadas pasadas se archivan en ramas (`2025_COAC_PRE`, `coac2024`…).

## Estructura

- `src/config/season.ts` — **único archivo que se toca al cambiar de fase**.
  `src/config/site.ts` — constantes que no cambian con la fase.
- `src/domain/` — lógica pura y testeada (`*.test.ts`): `schedule.ts`
  (`buildSchedule`: sesión activa, hora estimada, agrupación en directo),
  `loadSessions.ts`, `validate.ts`, `ids.ts`, `filterByAuthor.ts`.
- `src/lib/` — utilidades sin reglas del COAC (`dates.ts`, `youtube.ts`).
- `src/hooks/useNow.ts` — hora actual refrescada cada 30 s y al volver a la
  pestaña.
- `src/components/` — `layout/` (`SiteHeader`, `BottomNav`, `SiteFooter`),
  `schedule/` (`SessionSchedule`, `SessionLineup`, `PerformanceRow`…),
  `search/` (`AuthorSearch`), `ui/`. Solo pintan; no calculan fechas.
- `src/types.ts`, `src/styles.ts` — tipos y clases Tailwind compartidas.
- `vite-plugin-seo.ts` — en cada build valida los datos y genera el HTML
  estático dentro de `#root`, metadatos, JSON-LD de eventos y `sitemap.xml`.
- `tests/` — Playwright (capturas y comportamiento con reloj simulado) contra
  un build en modo `e2e` que sustituye el JSON por `tests/fixtures/`.
- `public/` — favicon, iconos, `og-image.png`, `robots.txt`, manifest.

## Decisiones vigentes

- **SEO sin SSR**: el plugin pone en `#root` el contenido real (mismo que ve
  el usuario) para crawlers sin JS. React lo sustituye con `createRoot`, no
  hidratación, así que no hay mismatch ni cloaking.
- `vite-plugin-seo.ts` está en `tsconfig.json` y reutiliza `SiteHeader` y el
  dominio de `src/`, para que nunca diverjan de la app.
- Las horas de la UI son estimaciones (`SEASON.minutesPerGroup` por
  agrupación, actuación + montaje).
