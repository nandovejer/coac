# Plan SEO + rendimiento (rama `proto/optimize`)

Sale de un debate entre un especialista en rendimiento/Core Web Vitals y uno de
SEO técnico (noviembre de 2026), con mediciones sobre el build de producción.
Regla del usuario: **no se quita ninguna funcionalidad ni rasgo visual**. El
objetivo no es la nota de Lighthouse, sino una carga sin saltos ni destellos y
un HTML que Google entienda.

## Diagnóstico

- **La «lista» al cargar.** `vite-plugin-seo.ts` (`buildStaticContent`) mete en
  `#root` la cabecera de la app anterior (`SiteHeader`) y una `<ul>` plana
  (`static-shell.css`). `main.tsx` monta VariantE con `createRoot` y lo tira
  todo. Se ve la lista **0,8 s en 4G y 2,1 s en 3G** (móvil, CPU ×4/×6). El CLS
  medido es solo 0,009 porque los nodos se sustituyen, no se mueven: el destello
  **no lo detecta CLS**, solo un filmstrip. El LCP medido es el h1 que luego se
  tira.
- **Recálculos de estilo forzados** al montar (~250–350 ms con CPU ×4):
  `useStickyHeights` (`VariantE.tsx` ~62-120) escribe variables CSS en `<html>` y
  `.coac-ve` y lee `getComputedStyle`/`offsetHeight` entre escrituras; cada
  lectura recalcula ~2.190 elementos. `useStuckFilters` añade otro. En scroll, el
  `ResizeObserver` repite: fotograma de 207 ms al quedarse fijo el filtro.
  `PrivacyNotice.tsx` (~37-49) escribe `--coac-privacy-notice-h` en `<html>`:
  ~105 ms más.
- **Saltos tardíos**: las flechas de `DayStrip` aparecen ~700 ms después
  (estado inicial `{start:true,end:true}` y medida en `useEffect`); el botón
  flotante del modo de color salta cuando entra el aviso de privacidad.
- **INP**: cada tecla, día o modalidad repinta el programa entero
  (`useProgramme`); «Borrar búsqueda» 216–272 ms con CPU ×4.
- **SEO**: el h1 de E es solo «¿Quién canta hoy?» (año y fase en un span hermano,
  y el h1 dentro de un `<span>`, HTML inválido); los h2 de sesión no llevan año;
  E perdió los ids de fecha que AGENTS exige y que el JSON-LD usa como `url`
  (`#21/01/2027`, que hoy no existe); JSON-LD sin `image`, `description`,
  dirección completa; fechas en UTC; la cuenta atrás («Faltan 57 días…») puede
  acabar como fragmento en Google.
- Ya está bien: sin fuentes web (DSEG7 ya no llega al build), sin imágenes, sin
  terceros, jspdf/html2canvas solo bajo demanda, JS inicial 68 kB gzip.

## Decisiones del debate

1. **Prerenderizar VariantE** en el build (`renderToStaticMarkup`) y seguir con
   `createRoot`. Descartados: `hydrateRoot` (`<luz-theme-mode>` y el estado de
   `localStorage`/`sessionStorage` provocan un rerender completo en React 18),
   ocultar el contenido hasta montar (pantalla vacía y riesgo SEO) y un esqueleto
   a mano (se desincroniza y no aporta texto).
2. **Rebuild diario por cron a las 03:15 UTC** (04:15 en Madrid en invierno,
   justo tras `sessionEndTime` 04:00; GitHub puede retrasarlo). El prerender usa
   como `now` **el mediodía (12:00 Madrid) del día del build**: así «Hoy»,
   «Mañana», «Celebrada» y el orden son correctos todo el día y ninguna
   actuación sale empezada.
3. **En el prerender se neutraliza todo lo que cambia por horas**: «Ya actuó»,
   «Actuando ahora», «A continuación», tira «En directo», barras de progreso,
   «Aún no ha empezado», «X de Y ya han actuado», «Empieza la sesión», las
   cifras de la cuenta atrás (marcadores «--» con el mismo ancho) y su texto
   accesible. El aviso de privacidad no se prerenderiza. Se mantienen «Hoy»,
   «Mañana», «Celebrada», «Próxima sesión», «Faltan N días · a las 20:00» y el
   resumen «No te pierdas…».
4. **Guarda si el cron falla**: script en línea de pocos bytes que compara la
   fecha del build (en un atributo) con la de hoy en Madrid; si difieren, pone
   `html[data-stale]` y el CSS oculta solo las etiquetas Hoy/Mañana hasta que
   monte React.
5. **JSON-LD al final del `<body>`**; title, description, canonical, OG y
   Twitter siguen en el `<head>` **antes** del `<style>` en línea (los
   rastreadores de previsualización leen solo los primeros kB).
6. **CSS en línea en todas las páginas** (se ahorra un viaje de red; 16,6 kB gzip
   no se repiten en una visita normal).
7. Sin service worker ni CDN por ahora (obligaría a tocar privacidad).

## Fases (ejecución)

Cada fase acaba con: `pnpm run lint && pnpm run typecheck && pnpm run test &&
pnpm run build`, y si toca estilos `pnpm run check:contrast && pnpm run
lint:luz`. **Comprobación visual de E**: los tests de Playwright del repo son de
la app anterior, así que antes de empezar se toman capturas de referencia de
VariantE con `now` fijo (móvil 390×844 y escritorio 1440×900; claro, oscuro y
alto contraste) y tras cada fase se comparan píxel a píxel. Cualquier diferencia
no explicada es un fallo. Scripts de medición del debate (reutilizables):
`/tmp/claude-1000/-home-ares-Documents-repos-coac/a955eb4b-58bb-4829-a9a5-4d6361cfcf10/scratchpad/perf/`
(`measure.mjs`, `trace2.mjs`, `scroll.mjs`, `inp.mjs`).

### F1 · Rendimiento interno (sin efecto SEO ni visual)
- `useStickyHeights`: leer todo y luego escribir, y solo si cambia;
  `--ve-top-h` en `.coac-ve__filters`, `--ve-filters-h` en
  `.coac-ve__sessions` (donde están sus consumidores), `scroll-padding-block-start`
  directo en `html.style`; `stickyHeaderHeight` sin `getComputedStyle` (usar
  `matchMedia` o la medida del `ResizeObserver`). Igual en `useStuckFilters`.
- `PrivacyNotice`: la altura se escribe donde se consume, no en `<html>`
  (`scroll-padding-block-end` directo).
- `DayStrip`: primera medida en `useLayoutEffect`.
- Botón flotante del modo de color y aviso de privacidad sin salto: mismo
  contenedor fijo en columna, o el botón acompaña con los tokens
  `--coac-dur-*`/`--coac-ease-*` dentro de `prefers-reduced-motion:
  no-preference`.
- Verificar: sin `UpdateLayoutTree` dentro de llamadas de React al montar, sin
  fotogramas largos en scroll, ninguna entrada de layout-shift en filmstrips.

### F2 · Metadatos y `<head>` (sin tocar la UI)
- Orden: `<meta charset>` primero, `theme-boot` después, metadatos, `<script
  type=module>` y modulepreload antes del `<style>`; JSON-LD al final del body.
- Title con «Orden de actuación y horarios» (≤ ~65 caracteres) y description con
  «Gran Teatro Falla» y «Carnaval de Cádiz».
- JSON-LD: `url` a `#dd/mm/yyyy` (existirá en F3), `name` legible («COAC 2027 ·
  Preliminares · Sesión del viernes 8 de enero»), `startDate`/`endDate` con
  desfase de Madrid (`+01:00`), `image` (og-image), `description` con el orden de
  actuación, `location.address` con `streetAddress: "Plaza de Fragela, s/n"`,
  `postalCode: "11003"`, `addressRegion: "Cádiz"`; `WebSite` con
  `alternateName` e `inLanguage: "es"`. Nada de `offers` ni `organizer` sin URL
  oficial verificada.
- `og:image:alt`, `<meta name="robots" content="max-image-preview:large">`.
- `public/404.html` estático y ligero, en español, con enlace a la portada y los
  colores del sitio (sin bundle).
- Verificar: JSON válido y con los campos, primeros ~2 kB del HTML con todos los
  metadatos, gzip del HTML.

### F3 · Semántica de E sin cambio visual
- h1 con la fase dentro (`¿Quién canta hoy?` + «COAC 2027 · Preliminares de
  adultos»): el h1 pasa a ser el grid de `.coac-ve__brand-text`, con el título
  en un span; la fase corta y la larga separadas (espacio o `aria-hidden` en la
  que no se ve). El h1 deja de estar dentro de un `<span>`.
- `<time datetime="yyyy-mm-dd">` en el título de cada sesión.
- Id de fecha `dd/mm/yyyy` en cada sección de sesión (sin quitar los ids que ya
  tenga) e `id="siteHeader"` en `.coac-ve__top`.
- `data-nosnippet` en la tarjeta de estado y la cuenta atrás.
- Verificar: capturas idénticas en los tres modos y dos tamaños, axe, anclas
  `#dd/mm/yyyy` y `#author2027…` funcionando.

### F4 · Prerender de VariantE (quita el destello)
- El plugin renderiza `<VariantE/>` con el `now` del punto 2 de las decisiones
  (Vite `ssrLoadModule` o un build `--ssr`; esbuild no carga CSS al leer
  `vite.config.ts`). Se pasa a la app un modo «prerender» que aplica la
  neutralización del punto 3 y no pinta el aviso de privacidad.
- Proteger accesos a `window`/`document`/`localStorage` en el render
  (`usePrivacyRoute.ts:12` y los que salgan).
- Entrada (`data-intro`): un script en línea toma la decisión de `shouldIntro`
  antes del primer pintado y la fachada se queda en su pose inicial hasta
  montar; VariantE lee esa decisión, sin repetir ni cortar la animación.
- CSS para `luz-theme-mode:not(:defined)` (que no floten los radios hasta que se
  define el elemento).
- Flechas de `DayStrip`: estado inicial por media query según el número de días.
- Fondo de `html`/`body` igual a `--vc-bg` en los tres modos (sin cambio de fondo
  al montar ni en el rebote de iOS).
- Guarda `data-stale` (punto 4) y fecha del build en un atributo.
- Opcional: conservar lo escrito en `#ve-search` antes de `createRoot`.
- Quitar `buildStaticContent` antiguo, el uso de `SiteHeader` en el plugin y en
  `main.tsx`, y `static-shell.css` (la app anterior sigue existiendo para
  `vite --mode anterior`).
- `deploy.yml`: `schedule: cron "15 3 * * *"` (aviso: GitHub lo desactiva tras
  60 días sin actividad en el repo).
- Verificar: filmstrips en 4G y 3G con VariantE desde la primera pintura (ningún
  fotograma de lista), LCP en un elemento de E; comprobación automática de
  `dist/index.html`: 1 h1 con año y fase, un h2 por sesión con `<time>`, un h3
  por agrupación, ids de fecha y de agrupación, `#siteMain`, y ninguna de las
  cadenas neutralizadas («Ya actuó», «Actuando ahora», «En directo», cifras de
  la cuenta atrás); texto del prerender igual al pintado por React con el mismo
  `now` (salvo lo neutralizado); sin JS, la página se lee completa.

### F5 · INP
- `useDeferredValue(term)` en `useProgramme`; `startTransition` en «Borrar
  búsqueda» y en los cambios sin View Transition (las ramas con View Transition
  siguen síncronas, `motion.ts` manda); tarjeta memoizada con props primitivas
  (`liveProgress` solo en la que está en directo).
- Feedback al abrir imprimir en red lenta (estado en el botón o `fallback` con
  el `<dialog>` vacío), sin precargar el chunk para todos.
- Verificar: todas las interacciones < 200 ms con CPU ×4 (`inp.mjs`).

### F6 · Documentación
- AGENTS.md: quitar lo de DSEG7/jsDelivr (ya no está en el build) y el ancho de
  cifra; actualizar «Layout» y «SEO sin SSR» al prerender de E; mencionar el
  cron, la guarda `data-stale` y que los filmstrips (no el CLS) son la prueba
  del destello.
- Este plan: anotar lo hecho y las mediciones antes/después.

## Ejecución (12 de noviembre de 2026, rama `proto/optimize`)

Un commit por fase: F1 `45fb76f`, F2 `51cb4b5`, F3 `db27f53`, F4 `7879380`, F5 `c830ebf`,
F6 (este documento y AGENTS.md).

### Hecho

- **F1**: `useStickyHeights` lee todo y luego escribe, solo si cambia; `--ve-top-h` va en
  `.coac-ve__filters`, `--ve-filters-h` en `.coac-ve__sessions` y el `scroll-padding` directo
  en `<html>`; `stickyHeaderHeight` usa `matchMedia` en vez de `getComputedStyle`; primeras
  lecturas de `useStuckFilters` y `useHideHeaderOnScroll` en un `requestAnimationFrame`;
  `DayStrip` mide en `useLayoutEffect` y no cambia de estado si nada cambia;
  `PrivacyNotice` escribe su alto en pie, botón y columna (no en `<html>`); el botón del modo
  de color sube y baja con el aviso (`translate` con `--coac-dur-gentle`, solo con movimiento).
- **F2**: orden del `<head>` (charset, `theme-boot`, metadatos, módulo, `<style>`), JSON-LD al
  final del body, title «¿Quién canta hoy en el COAC 2027? Orden de actuación y horarios»,
  description con el Gran Teatro Falla y el Carnaval de Cádiz (+ «Web no oficial.» de la sesión
  legal), `robots max-image-preview`, `og:image:alt`; JSON-LD con `url #dd/mm/aaaa`, nombre
  legible, `startDate`/`endDate` con `+01:00` (`formatZonedIso`), `image`, `description` con el
  orden, dirección completa, `WebSite` con `alternateName` e `inLanguage`; `public/404.html`.
- **F3**: `<h1 class="coac-ve__brand-text">` con título y fase (ya no dentro de un `<span>`),
  `<time datetime>` en cada título de sesión, `id="dd/mm/aaaa"` en cada sección, `id="siteHeader"`,
  `data-nosnippet` en la tarjeta de estado y la cuenta atrás. Luz da a `<time>` otro tamaño y
  color: `global.css` los neutraliza. **Desviación**: el resumen «No te pierdas…» queda
  fuera de `data-nosnippet` (el atributo va en cada elemento de la tarjeta menos el resumen), para
  que siga pudiendo salir como fragmento (decisión 3).
- **F4**: prerender de E con `ssrLoadModule` en un servidor de Vite en modo middleware
  (`src/prerenderApp.tsx`, `PrerenderContext`); hora fija a las 12:00 de Madrid del día del build
  (`COAC_PRERENDER_DATE` para probar); neutralización de todo lo horario; scripts en línea del
  `<head>` (guarda `data-stale` con `data-built`, decisión de la entrada `data-intro`) y de la tira de
  días (flechas y día de hoy a la vista antes del primer pintado, en vez de la media query del plan:
  mide el ancho real y vale para cualquier fase); fondo de `html`/`body` = fondo de la app en los
  tres modos; `luz-theme-mode:not(:defined)`; `usePrivacyRoute` sin `window` en servidor; el
  buscador conserva lo escrito y el foco, y las anclas se recolocan al montar con la cabecera real;
  `deploy.yml` con cron `15 3 * * *`; `scripts/check-prerender.mjs` (también en CI y deploy).
  Se quitan `buildStaticContent`, el uso de `SiteHeader` en el plugin y en `main.tsx` y
  `static-shell.css`. El `span role="link"` de las fases por celebrar pasa a `<a role="link"
  aria-disabled>` porque `lint:luz` ya lee el HTML real. `tests/visual/modes.spec.ts`: el fondo
  esperado del `<body>` es ahora el de la app.
- **F5**: `useDeferredValue(term)` en `useProgramme`; tarjeta `Slot` memoizada con props
  primitivas (`liveProgress` solo en la que está en directo); los cambios sin View Transition
  (`willAnimateChange()` en `motion.ts`) van en `startTransition` y su scroll espera a que acabe;
  el botón de imprimir lleva `aria-busy` y un anillo mientras llega el modal (sin precargar el
  chunk).

### Comprobado

- Capturas de E (móvil 390×844 y escritorio 1440×900; claro, oscuro y alto contraste; programa
  completo, antes de empezar, en directo, con la cabecera fija en móvil y con el aviso de
  privacidad) idénticas píxel a píxel antes y después de cada fase (en F1 contra el estado
  inicial; en F2–F5 contra la app ya montada). Prerender frente a app montada: mismas cajas de
  todos los elementos y mismo texto, salvo lo neutralizado y el botón de modo de color.
- axe sin violaciones (WCAG 2.2 AA) en los tres modos, móvil y escritorio, con y sin directo.
  `check:contrast`, `lint:luz`, `check:prerender`, `format:check` y `test:motion` (46/46) pasan.
- `test:visual` (escrito para la app anterior): 16 pasan y 6 se omiten antes de los cambios y
  después; fallan los mismos tests antes y después (los de la app anterior). Sin actualizar capturas.

### Mediciones (móvil, CPU ×4 y 4G lenta; 3G con CPU ×6)

| | antes | después |
|---|---|---|
| Tiempo con la lista antigua a la vista (4G) | 548 ms (FCP 308 → monta 856) | 0 (el primer pintado ya es E) |
| Ídem en 3G | 1.738 ms (936 → 2.674) | 0 |
| LCP (4G) y su elemento | 308 ms, `h1.coac-site-header__title` (se tiraba) | 340 ms, `p.coac-ve__status-brief-text` de E |
| LCP (3G) | 936 ms (el mismo h1) | 904 ms, el mismo elemento de E |
| CLS (4G / 3G) | 0,0091 / 0,0091 | 0 / 0 |
| Tareas largas al montar (4G) | 142, 256, 336 y 106 ms | 61 y 353 ms (la segunda es el montaje de React) |
| Recálculos de estilo forzados dentro de React al montar | 6 de ~80 ms (más ~105 ms del aviso) | 1 de ~70 ms (el de la primera medida) |
| Montaje de React en una sola llamada | 143 + 263 + 340 + 100 ms | ~280 ms |
| Mayor fotograma largo al hacer scroll (LoAF) | 196 ms | 99 ms |
| `index.html` | 175,9 kB | 288,3 kB (37,7 kB gzip) |

INP, interacciones peores con CPU ×4 (movimiento normal / «reducir movimiento»):

| interacción | antes | después |
|---|---|---|
| primera tecla en el buscador | 136 ms | 40 ms |
| «Borrar búsqueda» | 232 ms | 48 ms |
| elegir modalidad | 160 / 216 ms | 160 / 48 ms |
| elegir y quitar día | 168 y 128 / 88 y 272 ms | 160 y 96 / 40 y 64 ms |
| cerrar el modal de imprimir con Esc | 200 ms | 208 ms |

El mes de noviembre no tiene sesión: las cifras «después» salen de un build sin sesión de hoy.
Las mediciones hechas más tarde, con el equipo cargado por otras sesiones, salieron más lentas
y no se usan.

### No hecho

- **Esc en el modal de imprimir (~208 ms con CPU ×4)**: lo cuesta el recálculo de estilos al
  cerrar el `<dialog>` modal (`:root:has(dialog:modal)` y el desplazamiento de la página); no
  depende de F5 y ya estaba cerca del límite. Sin solución limpia que no toque el modal.
- **Filmstrip de 3G con el pie del programa**: no se hizo una captura por fotograma de todos los
  perfiles; el control es CLS 0, las cajas idénticas y el LCP dentro de E.
- La opción de una media query por número de días para las flechas se sustituyó por el script (ver F4).
- Nada de la sección siguiente.

## Pendiente de decisión del usuario (no se ejecuta)

- **Search Console** (manual): propiedad de dominio por DNS, enviar
  `sitemap.xml`, Inspección de URL de la portada.
- **Textos nuevos visibles** para cubrir búsquedas: «Orden de actuación del
  listado oficial. Horas estimadas…» en la nota del pie y «…concurso del Gran
  Teatro Falla» en el aviso de web no oficial.
- **Páginas archivadas por fase** (`/2027/preliminares/`, con `<a href>` en el
  pie). El SEO las considera **imprescindibles antes de pasar a cuartos
  (21–24 de enero)**: si no, al cambiar de fase desaparece el contenido de
  preliminares y sus posiciones.
- **URL por sesión** (`/2027/preliminares/8-enero/`) con un `Event` cada una,
  la app arrancando en ese día y sincronizando la URL; quitar los `Event` de la
  portada. Es lo que haría elegibles los resultados enriquecidos de eventos.
  Idealmente antes del 8 de enero.
- **og-image nueva** con la fachada y «COAC 2027 · Preliminares» (la actual es el
  diseño antiguo, con emoji y degradado).
