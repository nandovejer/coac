# ¿Quién canta hoy en el COAC?

Web estática que muestra qué agrupaciones cantan en cada sesión del COAC
(Concurso Oficial de Agrupaciones Carnavalescas de Cádiz), con horario estimado
por agrupación, buscador de autores y enlace al directo.

Vite + React 18 + TypeScript + [Luz](https://github.com/nandovejer/luz)
(`@luz-ds/*`, sistema de diseño en CSS) + CSS propio. Sin router, sin estado global, sin
backend: todo se sirve estático desde GitHub Pages. Comandos y cambio de fase
(3 pasos): [README.md](README.md). Planes (registro de lo hecho y por qué):
[.claude/plans/PLAN-OPTIMIZACION.md](.claude/plans/PLAN-OPTIMIZACION.md) y
[.claude/plans/PLAN-LUZ.md](.claude/plans/PLAN-LUZ.md).

## Verificar un cambio

```bash
pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build
pnpm run check:contrast && pnpm run lint:luz   # tras tocar estilos (lint:luz lee dist/)
pnpm run test:visual   # si tocas UI: capturas, modos de color y axe
```

`test:visual` falla ante cualquier diferencia visual. Si el cambio de aspecto es
intencionado, `pnpm run test:visual:compare` genera imágenes antes | después |
diferencias en `tests/visual/compare/` para revisarlas a ojo, y luego
`pnpm run test:visual:update`. Las capturas son de Linux y no se ejecutan en CI.

## Reglas

- Todo el texto visible está en español. Los identificadores en inglés, salvo
  los campos del JSON (`modalidad`, `autor`, `nombre`, `ciudad`).
- **No cambies el formato ni el contenido de `src/data/COAC_*.json`** sin que
  te lo pidan: se copian del listado oficial. Si ves algo raro, avisa.
- **Zona horaria**: toda hora de sesión es `SITE.timeZone` (`Europe/Madrid`),
  nunca la del navegador ni la del build. No uses `new Date().getHours()` ni
  similares: usa `domain/schedule.ts`, que recibe `now` como parámetro.
- **Estilos**: Luz + CSS propio, sin Tailwind ni ninguna otra utilidad.
  - Solo clases de los `classes.json` de `@luz-ds/*` (las del selector de modo)
    o propias con prefijo `coac-` (BEM: `coac-session__title`). Nunca inventes
    clases `luz-*`. Las variantes por dato van en atributos (`data-ranking`,
    `data-modalidad`, `data-status`).
  - Colores y tamaños con tokens: `--luz-*` (espacios `--luz-space-*`, texto
    `--luz-text-*`) o `--coac-*` (`src/styles/coac-tokens.css`). Nunca un hex
    suelto en un componente: tiene que funcionar en los tres modos.
  - Los colores de cada modo se definen en `src/styles/theme-coac.css` (tokens
    de Luz) y `coac-tokens.css` (propios), con los mismos selectores de modo.
  - Cada componente importa su `.css` (uno por `.tsx`); el CSS propio no va en
    ningún `@layer`, así gana siempre a Luz.
  - `@luz-ds/*` está fijado a una versión exacta y está en beta: lee su
    CHANGELOG antes de subirla y comprueba las capturas.
- **Modos de color**: claro, oscuro y alto contraste (`ThemeModeSwitch`, el
  botón flotante de Luz sobre el menú). Oscuro y alto contraste cumplen WCAG AA
  (lo vigilan `check:contrast`, `src/styles/coac-tokens.test.ts` y axe).
  **Deuda aceptada en modo claro**, que conserva el aspecto original: el texto
  blanco sobre el degradado de la cabecera de sesión, los títulos y la etiqueta
  de cuenta atrás con texto en degradado, y el texto ámbar de las filas "ok" no
  llegan a 4,5:1. No los "arregles" sin que te lo pidan.
- La app se sirve bajo `base: "/coac-quien-canta-hoy/"` (`vite.config.ts`).
- No renombres los ids del DOM (`siteHeader`, `siteMain`, `searchAuthor`,
  `session-present|future|past`, las fechas y los ids de agrupación): son
  anclas del menú y del buscador.
- No dejes dos archivos con el mismo nombre base en `.ts` y `.tsx`: esbuild
  resuelve `.tsx` primero y el build se rompió así.
- El deploy es por GitHub Actions al hacer push a `main`. `pnpm run deploy`
  solo relanza ese workflow (`gh workflow run`); no publica desde la máquina.
  Es cosa del usuario: no lo ejecutes (y `pnpm deploy` sin `run` es otro
  comando de pnpm).
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
- `src/components/` — `layout/` (`SiteHeader`, `BottomNav`, `SiteFooter`,
  `ThemeModeSwitch`), `schedule/` (`SessionSchedule`, `SessionLineup`,
  `PerformanceRow`…), `search/` (`AuthorSearch`), `ui/`. Solo pintan; no
  calculan fechas. Cada uno con su `.css`.
- `src/styles/` — `index.css` (orden de carga: tokens y base de Luz, selector
  de modo, tema propio, tokens propios, global), `theme-coac.css` (tema de Luz,
  3 modos), `coac-tokens.css`, `global.css` (neutraliza lo que Luz añade a las
  etiquetas HTML) y `static-shell.css` (HTML estático del SEO).
- `src/types.ts` — tipos compartidos.
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
  dominio de `src/`, para que nunca diverjan de la app. Por eso el CSS de
  `SiteHeader` se importa desde `App.tsx` (esbuild no carga CSS al leer
  `vite.config.ts`). El plugin también mete en línea `theme-boot` de Luz al
  principio del `<head>`: aplica el modo de color antes del primer pintado.
- `<luz-theme-mode>` es un elemento personalizado de Luz que añade su propio
  botón al DOM: se renderiza una vez (`memo`) y React no debe volver a tocarlo.
  Luz no escribe textos propios; los de `ThemeModeSwitch` son los del lector de
  pantalla.
- Las horas de la UI son estimaciones (`SEASON.minutesPerGroup` por
  agrupación, actuación + montaje).
