# Plan: de Tailwind a Luz — rama `feature/luz`

> Creado el 02/11/2026. Objetivo: sustituir Tailwind por el design system
> [Luz](https://github.com/nandovejer/luz) (`@luz-ds/*` 0.3.0) manteniendo el
> aspecto actual, y aprovechar la migración para añadir los modos de color de
> Luz (claro, oscuro y alto contraste).
>
> **Estado: pendiente.**

## Decisiones tomadas (02/11/2026)

| Tema | Decisión |
|---|---|
| Aspecto | **Tema propio `coac`** creado desde la plantilla de Luz (`_template.css`), con los colores y la fuente sans actuales. No se adopta el look "Vejer" (serif ET Book, crema, azul cielo). |
| Qué se carga de Luz | **Tokens + `base.css` de core + lo mínimo** (el CSS del selector de modo y, si encaja, algún componente suelto). Sin `luz.css` completo y sin catálogo. |
| Modos de color | **Sí**: claro, oscuro y alto contraste. |
| Contraste en modo claro | **Se mantiene el aspecto actual** aunque no cumpla AA en algunos puntos (ver "Deuda de contraste"). Los modos oscuro y alto contraste **sí** cumplen AA. |
| Selector de modo | El botón redondo flotante de Luz (`<luz-theme-mode>`), en la esquina inferior derecha, **por encima del menú fijo inferior**. |
| Capturas | Comparativas antes/después de cada escenario, **revisión manual** y, con visto bueno, nuevas capturas de referencia con tolerancia 0. |
| JavaScript | El de Luz para lo que Luz ya hace (selector de modo). Todo lo demás sigue en React. |
| CSS | Lo que no está en Luz, en CSS vanilla con clases propias `coac-*`. |
| JSX | Se puede cambiar la estructura de los componentes cuando simplifique el CSS o mejore la semántica, siempre que la captura en modo claro siga pasando la revisión. |

**¿Bastan tokens y core?** Sí. Lo único que interesaba del catálogo
(`<luz-theme-time>`, el modo según la hora del día) no hace falta: el selector
de modo está en core. Ninguna pieza del catálogo (`site-header`, `navbar`,
`stat`…) reproduce el aspecto actual sin sobrescribirla casi entera.

## Qué es Luz (lo que importa para este proyecto)

- 4 paquetes en npm, versión **0.3.0 (beta)**: `@luz-ds/tokens` (custom
  properties, modos de color, fuente ET Book), `@luz-ds/core` (reset,
  etiquetas HTML sin clase, objetos `.o-*`, utilidades `.u-*`, componentes
  `.luz-*`, JS opcional), `@luz-ds/catalog` (patrones de página) y
  `@luz-ds/check` (linter de HTML/CSS para clases de Luz).
- **Beta**: puede romper entre versiones menores. Se fija la versión exacta y
  se lee el CHANGELOG antes de actualizar.
- Todo su CSS va en *cascade layers* (`luz.tokens`, `luz.themes`,
  `luz.elements`…) y con especificidad cero (`:where`). **Cualquier CSS
  nuestro sin layer gana siempre**, sin `!important` ni selectores largos.
- Estiliza el HTML **sin clases**. Por eso, aunque no usemos sus componentes,
  `base.css` cambia `body`, encabezados, enlaces, `details`/`summary`,
  `input`, etc. Eso es lo que hay que neutralizar para conservar el aspecto.
- No cambia de modo por `prefers-color-scheme` por sí solo: el modo lo ponen
  `data-theme`/`data-mode` en `<html>` (los escriben su script `theme-boot` y
  el elemento `<luz-theme-mode>`).
- Los temas propios solo sobrescriben **tokens semánticos**
  (`--luz-surface-page`, `--luz-text-primary`, `--luz-brand-*`…), más la
  fuente, los radios y las sombras de forma opcional.

## Diagnóstico actual

- Tailwind 3.4 + `tailwind-scrollbar` + PostCSS/Autoprefixer.
- ~120 clases de Tailwind distintas en 14 archivos: 11 componentes,
  `src/styles.ts` (colores por modalidad y ranking) y el HTML estático de
  `vite-plugin-seo.ts`. `@apply` solo en `index.css` (`bg-slate-50`).
- CSS publicado: **15 KB (3,5 KB gzip)**. JS de la app: 7 KB gzip + React 45 KB.

## Qué se carga de Luz

```ts
// src/styles/index.css (orden importante)
@import "@luz-ds/tokens/tokens.css";          // tokens sin @font-face: no se descarga ET Book
@import "@luz-ds/core/base.css";              // settings + reset + etiquetas HTML
@import "@luz-ds/core/components/theme-mode.css";
@import "./theme-coac.css";                   // tema Luz: tokens semánticos x 3 modos
@import "./coac-tokens.css";                  // tokens propios de la app x 3 modos
@import "./global.css";                       // body, sr-only, keyframes, scrollbar…
// + el CSS de cada componente, importado desde su .tsx
```

```ts
// src/main.tsx
import "@luz-ds/core/theme-mode"; // define <luz-theme-mode>; sin efectos hasta que aparece
```

- `theme-boot.min.js` (285 B gzip) **en línea en el `<head>`**, insertado por
  `vite-plugin-seo.ts`, para aplicar el modo guardado o el del sistema antes
  del primer pintado (sin destello de modo claro).
- `<html lang="es" data-theme="coac" data-luz-themes="coac">`.
- **No** se usa: `luz.css` completo (11,7 KB gzip), `luz-tokens.css` (incluye
  ET Book), `luz.js` (inicializa todo), catálogo.
- `.u-sr-only`, `.o-container` y el resto de utilidades/objetos **no vienen
  en `base.css`** (solo en `luz.css` completo). Las 2-3 que hacen falta se
  escriben en vanilla.
- Peso estimado: tokens 2,7 + base 3,4 + theme-mode 1,2 + CSS propio ~3 KB
  ≈ **10 KB gzip de CSS** (antes 3,5 KB) y +1,2 KB gzip de JS. Es el coste de
  traer el reset y los tres modos; se mide al final y se reporta.
- Componentes sueltos de core (p. ej. `luz-tag` para los chips de modalidad):
  **solo si** con nuestros tokens quedan como ahora con 2-3 ajustes como
  mucho. Si hay que sobrescribirlos casi enteros, se hace en vanilla.

## Correspondencia Tailwind → Luz / vanilla

| Tailwind | Sustituto | ¿Exacto? |
|---|---|---|
| Espacios `p-1…p-24`, `m-*`, `gap-*` | `--luz-space-2xs` (4 px), `xs` (8), `sm` (12), `md` (16), `lg` (24), `xl` (32), `4xl` (96); `py-0.5` → `3xs` | Sí: misma base de 4 px |
| `text-xs`, `text-sm`, `text-base`, `text-xl` | `--luz-text-xs` (0,75 rem), `sm` (0,875), `base` (1), `lg` (1,25) | Sí |
| `text-2xl…text-5xl` | Tokens propios `--coac-text-2xl…5xl` (1,5 / 1,875 / 2,25 / 3 rem) y sus interlineados | La escala de Luz (ratio 1,25) no coincide |
| `md:` (768 px) | `@media (min-width: 48rem)` literal (las custom properties no valen en media queries); igual que `--luz-mq-md` | Sí |
| `rounded` / `rounded-full` | `--luz-radius-md` (4 px) / `--luz-radius-full` | Sí |
| `rounded-lg` | `--coac-radius-lg` (8 px) | Propio |
| `shadow`, `shadow-lg`, `shadow-2xl` | El tema sobrescribe `--luz-shadow-sm/md/lg` con esos valores | Sí |
| Colores de superficie y texto (`bg-slate-50`, `bg-white`, `text-blue-700`…) | Tokens semánticos del tema `coac` (`--luz-surface-page`, `--luz-surface`, `--luz-brand-primary`…) | Sí (mismos hex) |
| Colores propios (cabecera `gray-800`, degradado `blue-500→teal-400`, chips por modalidad, filas por ranking, "EN DIRECTO") | `--coac-*` en `coac-tokens.css`, con valor por modo | Sí en claro |
| Fuente (sans del sistema) | El tema pone `--luz-font-body` y `--luz-font-heading` a `var(--luz-font-sans)` | Casi: la pila de Luz es `system-ui…`, la de Tailwind empieza por `ui-sans-serif`; mismo resultado en Linux/Android/iOS, se verifica en las capturas |
| `bg-clip-text text-transparent bg-gradient-to-r` | Vanilla (`background-clip: text` + `-webkit-background-clip`) | Sí |
| `tailwind-scrollbar` | Vanilla: `scrollbar-width: thin; scrollbar-color` | Casi: sin esquinas redondeadas en Chromium |
| `sr-only` | `.coac-sr-only` vanilla (mismas reglas) | Sí |
| `grayscale`, `opacity-50`, `divide-y` | Vanilla | Sí |
| `.blinking` (parpadeo de "EN DIRECTO") | Keyframes propios en vanilla; se para con `prefers-reduced-motion`, como hace Luz con todas sus animaciones | Cambia solo para quien pide menos movimiento |

### Lo que `base.css` cambia y hay que neutralizar

- `body`: Luz pone `font-size: var(--luz-text-body)` (1,0625 rem),
  `line-height: 1.6` y una transición de color. Se deja en 1 rem y 1.5 como
  Tailwind.
- Encabezados: peso 300, `letter-spacing: -0.02em`, interlineado 1.2. Los
  nuestros fijan peso y tracking explícitamente; se revisa cada uno.
- Ritmo vertical: Luz añade `margin-block-start` entre `p`, `h*`, `details`…
  hermanos. Cada componente fija sus márgenes.
- Enlaces: color de marca y subrayado. El menú inferior y los chips del
  buscador no van subrayados.
- `details`/`summary` ("Sesiones pasadas"): borde inferior, padding, fondo al
  pasar el ratón. Se anulan.
- Foco visible: Luz pone un contorno de 2 px. **Se mantiene** (es una mejora
  de accesibilidad sin coste visual en reposo).

## Arquitectura del CSS

```
src/styles/
  index.css          imports de Luz + tema + tokens + global (el único import global, desde main.tsx)
  theme-coac.css     tema Luz copiado de _template.css: tokens semánticos en 3 bloques
  coac-tokens.css    --coac-* (colores propios, tamaños de título, radio grande) en 3 bloques
  global.css         body, .coac-sr-only, keyframes, scrollbar
src/components/**/Componente.css   CSS de cada componente, importado desde su .tsx
```

- Clases propias con prefijo **`coac-`** y BEM (`coac-session`,
  `coac-session__title`, `coac-performance--live`). Nunca `luz-*` inventadas:
  `@luz-ds/check` las marcaría.
- Variantes por dato con atributos (`data-modalidad="CORO"`,
  `data-ranking="top"`) en vez de mapas de clases: `src/styles.ts`
  desaparece.
- CSS propio **sin layer** (gana a Luz). Los componentes usan tokens
  semánticos de Luz o `--coac-*`, nunca hex sueltos, para que los 3 modos
  funcionen solos.
- Se conservan los ids del DOM y las clases que ya usan los tests
  (`coac-session`, `blinking` → pasa a `coac-performance__status--live`, y se
  actualiza el test).

## Modos de color

- **Claro**: idéntico al actual, deuda de contraste incluida.
- **Oscuro** y **alto contraste**: paletas nuevas en `theme-coac.css` y
  `coac-tokens.css` que cumplen AA (4,5:1 en texto, 3:1 en bordes y foco). En
  alto contraste los degradados pasan a color sólido.
- Se diseñan con comparativas para tu revisión antes de fijar las capturas.
- **Selector**: `<luz-theme-mode>` con su marcado de radios (funciona sin JS
  gracias a `:has()`), en `App.tsx`. Es el botón redondo flotante de Luz,
  desplazado con CSS propio para quedar por encima del menú inferior
  (`bottom` = alto del menú + `--luz-space-md`) y con `z-index` mayor que el
  del menú.
- **Textos en español**: el JS de Luz traduce según `<html lang="es">`
  cargando su archivo `i18n-es`. Hay que comprobar que Vite lo empaqueta bien;
  si no, se fijan los textos con `data-luz-label-*`.
- El modo elegido lo guarda Luz en `localStorage` (`luz-theme`). En "Auto"
  sigue al sistema.
- TypeScript: declarar `luz-theme-mode` como elemento JSX en
  `src/luz-elements.d.ts`.

## Deuda de contraste aceptada (modo claro)

Se mantiene a propósito para no cambiar el aspecto. Queda documentada aquí y
en `AGENTS.md`:

| Dónde | Colores | Contraste |
|---|---|---|
| Cabecera de cada sesión ("MODALIDAD / NOMBRE…") | blanco sobre degradado `blue-500→teal-400` | 3,7:1 → 1,8:1 |
| Títulos con texto en degradado | `blue-500→teal-400` sobre `slate-50`/blanco | ~3,5:1 → 1,8:1 |
| Filas de ranking "ok" | `amber-700` sobre `amber-300` | ~3,2:1 |

El test de accesibilidad (Fase 5) excluye estos tres puntos **solo en modo
claro**.

## Fases

### Fase 0 — Rama y punto de partida (S)

- `git switch main && git pull && git switch -c feature/luz`.
- Primer commit: este plan.
- Generar en una carpeta sin versionar (`tests/visual/before/`, ignorada) las
  capturas actuales de todos los escenarios: serán la mitad "antes" de las
  comparativas.

### Fase 1 — Instalar Luz junto a Tailwind (S)

- `pnpm add -E @luz-ds/tokens@0.3.0 @luz-ds/core@0.3.0` y
  `pnpm add -DE @luz-ds/check@0.3.0`.
- Crear `src/styles/` con `theme-coac.css` (desde `_template.css`, solo
  modo claro de momento), `coac-tokens.css` y `global.css`.
- `<html data-theme="coac" data-luz-themes="coac">`.
- Durante la migración conviven Tailwind y Luz: los imports de Luz van
  **antes** que `@tailwind`, para que el preflight de Tailwind y las
  utilidades sigan mandando hasta que se quiten.

### Fase 2 — Migrar componentes, de hoja a raíz (M)

Orden: `ModalidadBadge`, `PreviousYearLink`, `PerformanceRow`,
`SessionLineup`, `GradientHeading`, `NextSessionCountdown`,
`SessionSchedule`, `AuthorSearch`, `SiteHeader`, `SiteFooter`, `BottomNav`.

Para cada uno: crear su `.css`, sustituir las clases de Tailwind por clases
`coac-*`, simplificar el JSX donde sobren envoltorios, y pasar
`pnpm run test:visual`. Mientras Tailwind siga cargado, las capturas deben
seguir idénticas. Así cada componente se valida por separado.

`src/styles.ts` se elimina al terminar `PerformanceRow` y `ModalidadBadge`.

### Fase 3 — Quitar Tailwind (S)

- Borrar `@tailwind` de `index.css`, `tailwind.config.mjs`,
  `postcss.config.js` y las dependencias `tailwindcss`, `tailwind-scrollbar`,
  `postcss` y `autoprefixer`.
- HTML estático de `vite-plugin-seo.ts`: clases nuevas y `theme-boot` en
  línea.
- Ahora sí aparecen las diferencias del reset de Luz frente al preflight de
  Tailwind: neutralizarlas (lista de arriba) hasta que las capturas pasen o
  las diferencias que queden sean mínimas y explicables.
- **Comparativas**: script `pnpm run test:visual:compare` que genera, por
  escenario, una imagen antes | después | diferencias en `tests/visual/compare/`
  (sin versionar). **Revisión tuya.** Con tu visto bueno,
  `pnpm run test:visual:update`.

### Fase 4 — Modos oscuro y alto contraste (M)

- Completar los bloques dark y high-contrast de `theme-coac.css` y
  `coac-tokens.css`.
- `npx @luz-ds/tokens@0.3.0 check-contrast src/styles/theme-coac.css` en
  verde (comprueba los pares semánticos de Luz en los 3 modos).
- Añadir `<luz-theme-mode>` y su CSS de posición.
- Comparativas de los dos modos nuevos para tu revisión.

### Fase 5 — Tests (M)

- **Capturas**: los 6 escenarios actuales en claro (móvil y escritorio) + "en
  directo" y "buscador" en oscuro y alto contraste.
- **Selector de modo**: cambia de modo al pulsarlo, se recuerda al recargar,
  no hay destello (el `data-mode` ya está en `<html>` antes del primer
  pintado) y funciona sin JavaScript.
- **Accesibilidad**: `@axe-core/playwright` en los 3 modos, con la deuda del
  modo claro como excepción explícita.
- Los tests de reloj y del buscador no cambian.

### Fase 6 — Lint, CI y docs (S)

- `luz-check` (de `@luz-ds/check`) sobre `dist/index.html` y `src/**/*.css`
  en un script `lint:luz`, y en CI junto al `check-contrast`.
- `AGENTS.md`:
  - Luz como sistema de diseño;
  - solo clases de los `classes.json` de Luz o `coac-*`;
  - tokens semánticos, nunca hex;
  - los 3 modos;
  - la deuda de contraste;
  - `@luz-ds/*` fijado a versión exacta: leer el CHANGELOG antes de subirlo.
- Opcional: `npx @luz-ds/check@0.3.0 agent > .claude/agents/luz-accessibility-reviewer.md`
  (el revisor de accesibilidad que trae Luz).
- README: dependencias y comandos nuevos.
- Medir CSS/JS final y apuntarlo aquí.

### Fase 7 — PR (S)

PR `feature/luz` → `main` con:
- las comparativas;
- el peso antes/después;
- la lista de diferencias aceptadas.

Merge normal tras CI en verde y tu revisión. El deploy sale de `main` como
siempre.

## Riesgos

- **Luz es beta (0.3.0)**: versión exacta fijada; cualquier subida, en su
  propia PR con las capturas.
- **Más CSS** (~3,5 → ~10 KB gzip): es el precio del reset de Luz y los 3
  modos. Si molesta, se puede recortar sustituyendo `base.css` por un reset
  propio (pero se pierde lo que da Luz).
- **Fuente**: la pila sans de Luz (`system-ui`) y la de Tailwind
  (`ui-sans-serif, system-ui…`) pueden elegir fuentes distintas en algún
  sistema. Las capturas son de Linux; en macOS/Windows se revisa a mano una vez.
- **`<luz-theme-mode>` dentro de React**: es un custom element que gestiona
  sus propios hijos. Se renderiza una vez y React no debe volver a tocarlo;
  si da guerra, se monta con un `ref` y `useEffect`.
- **i18n de Luz con Vite**: el archivo `i18n-es` se carga dinámicamente;
  verificar que se empaqueta y que funciona bajo `/coac-quien-canta-hoy/`.
- **Safari y `background-clip: text`**: se escribe también con prefijo
  `-webkit-`.

## Fuera de alcance

- Adoptar el look Vejer, la fuente ET Book o el catálogo de Luz.
- Arreglar la deuda de contraste del modo claro.
- Modo según la hora del día (`<luz-theme-time>`, catálogo).
- Cambios de funcionalidad aparte de los modos de color.
