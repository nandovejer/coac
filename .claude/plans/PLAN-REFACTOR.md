# Plan de refactor: de prototipo a web final (rama `proto/optimize`)

Estado: **pendiente de ejecutar** (redactado el 12/11/2026 sobre `aba9bc7`, que es
lo publicado en coac.com.es). Se ejecuta por fases y solo cuando el usuario lo diga.
Nada va a `main` sin orden expresa.

**Hecho el 12/11/2026** (sobre `5008d24`, etiqueta `archivo/pre-refactor` subida):
R1 (borrar lo muerto) y R2 (carpetas por función, con `VariantE` → `app/App`,
`ShellDialogs` → `AppDialogs` y `parts.tsx` partido en `PreviousNote` y
`ModalidadFilter`). R0 se hizo en versión corta: en vez de capturas nuevas, el
build se comparó con el del punto de partida (`index.html` igual salvo los
hashes, CSS idéntico byte a byte) y pasaron `test:motion` y todos los checks.
También R4: `coac-ve` → `coac-app`, `--ve-*` y `--vc-*` → `--coac-app-*` (sin
colisiones: los nombres de las dos familias no coincidían), transiciones e ids
`ve-*` → `coac-*` (`coac-search`, `coac-phases-title`, `coac-print-title`) y fuera
el selector muerto `.coac-vc` de los prototipos. Prueba: aplicando el mismo
renombrado al build anterior, `index.html` y el CSS salen iguales byte a byte;
el HTML pasa de 282 a 286 kB y el JS gana 233 bytes, solo por el prefijo más
largo. Quedan R0 completo (tests visuales de E), R3, R5 (planes viejos) y R6.
Pendiente aparte: CSS de la app anterior que sigue en `global.css`
(`coac-scrollbar--on-header`, `coac-live-ring`, `--coac-topbar-height`) y los
34 avisos de `luz-check` en `src/app` y `src/dialogs` (sobre todo las hojas de
imprimir, que usan blanco fijo a propósito), que `lint:luz` aún no revisa.

**Punto de partida**: la punta de `proto/optimize` el día que empiece R0, no
`aba9bc7`. Todo lo que entre antes en la rama se refactoriza igual que lo demás y
queda cubierto por las capturas y la huella de R0.

### Cambios que entraron después de redactar el plan

| Commit | Qué | Cómo entra en el refactor |
|---|---|---|
| `fd31834` (sesión coac-15) | «Quiénes somos»: sección «Gratis y sin publicidad, siempre» (`src/variants/about/AboutDialog.tsx`); pie de E: `<p>` final en `.coac-ve__footer-text` con «Gratis y sin publicidad, siempre: esta web no gana dinero con nada.» (`VariantE.tsx`) | R0: capturas del pie (móvil y escritorio, tres modos) y del modal «Quiénes somos» entero, con la sección nueva; la huella del HTML incluye el texto del pie. R2: `AboutDialog.tsx` pasa a `src/dialogs/about/` con `git mv`. R3: si se extrae el pie, el `<p>` va con él. R4: su clase pasa a `coac-app__footer-text`. Prueba manual: los dos textos siguen ahí al acabar cada fase. |

## Objetivo

La web ya no es un prototipo: `VariantE` es la app publicada. Hay que quitar lo que
quedó de la etapa de prototipos (app anterior, variantes C y D, docs de planes ya
cumplidos) y ordenar carpetas y nombres según su función. **Regla de oro: el
usuario no nota nada.** Mismo HTML prerenderizado, mismos ids, mismo aspecto
píxel a píxel, mismas funciones, mismo SEO. Todo lo que se borra queda en git, con
etiquetas para recuperarlo con un solo comando.

## Qué hay hoy (medido)

| Qué | Dónde | Estado |
|---|---|---|
| App publicada (E) | `src/variants/VariantE.tsx` (1.245 líneas) + `.css` (2.769) | se queda, cambia de nombre y sitio |
| Piezas de E | `src/variants/` (Countdown, motion, useProgramme, useShell, ShellDialogs, phases, parts, sessionBrief, useGhostMark, useReached, prerender, `about/`, `info/`, `print/`, `privacy/`) | se quedan, se reordenan |
| Prototipos C y D | `src/variants/VariantC.*`, `VariantD.*`, `DayCarousel.*` (solo los usa C) | código muerto en producción |
| App anterior | `src/App.tsx`, `App.css`, casi todo `src/components/` (layout, schedule, search, ui/Heading, RollingNumber, ScrollRow), `hooks/useOpenDetailsOnAnchor`, `hooks/useScrolledPast` | código muerto: solo se ve con `vite --mode anterior` |
| De `components/` E solo usa | `ui/icons`, `ui/FallaLogo`, `ui/facade`, `layout/ThemeModeSwitch` | se quedan |
| Tests visuales | `tests/visual/*.spec.ts` + 22 capturas | escritos para la app anterior: 6 fallan y no protegen E |
| Tests de movimiento | `tests/motion/motion.spec.ts` | sí prueban E: se quedan |
| Sin uso | `src/assets/bg.png`, `formatLongDate` (`lib/dates.ts`), `tests/fixtures/dseg/` (fuente de la app anterior) | se borran |
| Planes cumplidos | `.claude/plans/PLAN-LUZ.md` (363), `PLAN-OPTIMIZACION.md` (591), `PLAN-ANIMACIONES.md` (428), `PLAN-SEO-RENDIMIENTO.md` (285) | se resumen y se archivan |
| Prefijo de prototipo | `coac-ve__*` (≈600 usos), `--ve-*` (≈240), ids `ve-search`, `ve-phases-title`, `ve-print-title` | «ve» = «variante E»: se renombra |
| Worktrees de git | solo uno (este) | nada que limpiar |
| Ramas | `proto/coac` (intento anterior, 1 commit, 17 por detrás de `main`); en origin: `feature/luz`, `feature/refactor`, `prototipos-ux`, `coac_2025_pre` ya fusionadas | ver R6 |
| Stash | `stash@{0}` «DOMINIO COAC.COM.ES» | ya está en `main` (base `/`, URL de coac.com.es): se archiva y se borra |
| Otra carpeta | `../coac-quien-canta-hoy` | es **otro repo** de GitHub (la web antigua), no un worktree: fuera de este plan |

## Qué se mejora respecto al intento de `proto/coac` (9c8b083)

1. **Borró AGENTS.md, CLAUDE.md, README.md y la skill `nueva-fase`.** Aquí se
   conservan y se actualizan: son las instrucciones del proyecto y el paso de fase.
2. **Mezclaba en un commit mover, renombrar clases y cambiar código** (VariantE.css
   pasó a `ProgrammeApp.css` con solo un 61 % de parecido): `git log --follow` y
   `git blame` perdían el historial. Aquí cada fase es un commit de un solo tipo,
   y los movimientos son `git mv` puros (100 % de parecido).
3. **Se quedaba con los prototipos** en `src/prototypes/`. Aquí salen de `src/` y se
   recuperan desde una etiqueta.
4. **No tenía red de seguridad**: los tests visuales seguían siendo los de la app
   anterior. Aquí lo primero (R0) es crear tests visuales de E.
5. **Era anterior al prerender y al SEO**: no conocía `vite-plugin-seo.ts`,
   `prerenderApp.tsx`, `check-prerender.mjs` ni los scripts en línea, que leen
   clases e ids de E. Aquí entran en cada fase.
6. `ProgrammeApp` pasa a llamarse simplemente `App`.

## Garantías (se comprueban al final de cada fase)

```bash
pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build
pnpm run check:prerender && pnpm run check:contrast && pnpm run lint:luz && pnpm run format:check
pnpm run test:visual    # capturas nuevas de E (R0): 0 píxeles de diferencia
pnpm run test:motion
```

Además, una **huella del HTML** (script temporal en el scratchpad, no en el repo)
que saca de `dist/index.html` los ids, el texto visible, las etiquetas `<meta>`, el
JSON-LD y el número de elementos. Se guarda la del punto de partida y tiene que salir
idéntica en todas las fases. En R4 la comparación es más estricta: el HTML entero
tiene que ser igual byte a byte, cambiando solo el prefijo viejo por el nuevo.
También se compara el peso de los JS y del `index.html` (no puede subir).

Lista de funciones que se prueban a mano en el servidor local al cerrar cada fase:
estados de sesión (hoy, mañana, próximas, celebradas), «Actuando ahora», «A
continuación» y la tira «En directo» (con `COAC_PRERENDER_DATE` y el reloj de
los tests), buscador (texto, modalidades y alcance), carrusel de días y flechas,
cuenta atrás, modales (imprimir horario, porra en imagen y PDF, privacidad en
`#privacidad` con «Atrás», «Quiénes somos» con «Gratis y sin publicidad,
siempre», info), el pie con sus créditos y la frase de «sin publicidad», tres modos de color,
cabecera que se esconde en móvil, filtro fijo en escritorio, anclas de fecha y de
agrupación, sin destello al cargar (filmstrip), meta de compartir, JSON-LD y `sitemap.xml`.

## Fases

Cada fase es un commit (o varios del mismo tipo) en `proto/optimize`, con push.

### R0 · Red de seguridad (sin tocar la app)

- Etiquetas que se suben a origin (no tocan `main`):
  - `archivo/pre-refactor` → punto de partida: el estado completo antes de tocar nada, con la app
    anterior, C, D y los planes. Para recuperar cualquier cosa:
    `git checkout archivo/pre-refactor -- <ruta>`.
  - `archivo/proto-coac` → `9c8b083`, el intento anterior.
  - `archivo/stash-dominio` → `stash@{0}`, antes de borrarlo.
- Rehacer `tests/visual/` para E con los mismos datos fijos (`tests/fixtures/`) y
  el mismo reloj simulado: antes de la primera sesión, sesión de hoy en directo,
  madrugada con la sesión de ayer, fase terminada, búsqueda con resultados, un
  día elegido, pie, modales (imprimir, privacidad, quiénes somos entero), en móvil y
  escritorio y en los tres modos, más axe. Las capturas se generan **con el código
  de hoy**: son la referencia que todas las fases siguientes deben igualar.
  Se borran las 22 capturas de la app anterior.
- Guardar la huella del HTML del punto de partida.
- Antes de empezar, `git status` limpio y `git log origin/proto/optimize..` vacío:
  si otra sesión ha dejado commits o cambios en la rama, se parte de ellos.

### R1 · Borrar lo muerto

- `src/App.tsx`, `src/App.css`.
- `src/components/`: todo menos `ui/icons.*`, `ui/FallaLogo.tsx`, `ui/facade.ts` y
  `layout/ThemeModeSwitch.*`.
- `src/hooks/useOpenDetailsOnAnchor.ts`, `src/hooks/useScrolledPast.ts`.
- `src/variants/VariantC.*`, `VariantD.*`, `DayCarousel.*`.
- `src/main.tsx`: quitar `devApps` y los modos `anterior` y `variant-d`.
- `src/assets/bg.png`, `tests/fixtures/dseg/`, `formatLongDate` (y cualquier
  export que quede sin uso: se busca con `pnpm dlx knip` una vez, sin añadirlo
  al proyecto).
- `--coac-topbar-height` y el `scroll-padding` de `global.css` **no se tocan en
  R1**: nacieron con la app anterior, pero afectan a las anclas de E en móvil.
  Solo se quitan si las capturas y la prueba de anclas lo confirman.
- `package.json`: actualizar las rutas de `lint:luz`.

### R2 · Carpetas por función (solo `git mv` y rutas de import)

Ningún cambio de contenido salvo los `import`, para que el historial siga a cada archivo.

| Antes | Después | Por qué |
|---|---|---|
| `src/variants/VariantE.tsx` / `.css` | `src/app/App.tsx` / `App.css` | es la app |
| `src/variants/useProgramme.ts`, `useShell.ts` | `src/app/` | estado de la app |
| `src/variants/ShellDialogs.tsx` | `src/app/AppDialogs.tsx` | monta los modales de la app |
| `src/variants/prerender.ts` | `src/app/prerenderContext.ts` | contexto del prerender |
| `src/prerenderApp.tsx` | `src/prerender.tsx` | entrada del build, junto a `main.tsx` |
| `src/variants/phases.ts` | `src/domain/phases.ts` | reglas del COAC, sin React |
| `src/variants/sessionBrief.ts` (+ test) | `src/domain/sessionBrief.ts` | lógica pura y testeada |
| `src/variants/motion.ts` | `src/lib/motion.ts` | utilidad sin reglas del COAC |
| `src/variants/useGhostMark.ts`, `useReached.ts` | `src/hooks/` | hooks |
| `src/variants/Countdown.*` | `src/components/status/` | tarjeta de estado |
| `src/variants/parts.tsx` | `src/components/programme/PreviousNote.tsx` y `src/components/filters/ModalidadFilter.tsx` | un componente por archivo |
| `src/variants/about/`, `info/`, `privacy/`, `print/`, `dialog-motion.css` | `src/dialogs/…` | los modales, cada uno con su lógica |
| `src/components/layout/ThemeModeSwitch.*` | sin cambio | |
| `src/components/ui/*` | sin cambio | |

`src/variants/` deja de existir. Se actualizan `vite-plugin-seo.ts`, `index.html`,
los comentarios que citan rutas y `playwright.motion.config.ts`.

Resultado:

```
src/
  main.tsx            entrada del navegador
  prerender.tsx       entrada del build (vite-plugin-seo.ts)
  app/                App, estado, modales montados, contexto del prerender
  components/         piezas visuales de la página (layout, status, programme, filters, ui)
  dialogs/            about, info, privacy, print
  hooks/  domain/  lib/  config/  data/  styles/
```

### R3 · Partir `App.tsx` y `App.css` (recomendado; se puede saltar)

1.245 + 2.769 líneas en dos archivos es lo que más cuesta mantener. Se extrae sin
cambiar ni una línea de lógica:

- Componentes: `Slot` → `components/programme/PerformanceCard.tsx`, `DayStrip` →
  `components/filters/DayStrip.tsx`, y cabecera, columna, filtro, sesión y pie
  si salen limpios (un `.tsx` con su `.css`, como pide AGENTS.md).
- Hooks: `useStickyHeights`, `useStuckFilters`, `useHideHeaderOnScroll`,
  `useThemeCurtain` → `src/hooks/`.
- CSS: cada bloque de `App.css` pasa al `.css` de su componente. **Riesgo: el orden
  de la cascada.** Se respeta el orden de los imports y la prueba son las capturas
  con 0 píxeles de diferencia; si un bloque da guerra, se queda en `App.css`.

### R4 · Prefijo propio en vez de «ve» (un commit mecánico)

- `coac-ve` → `coac-app` y `--ve-` → `--coac-app-` en CSS, TSX, tests,
  `vite-plugin-seo.ts` (scripts en línea) y `check-prerender.mjs`.
- Ids internos `ve-search`, `ve-phases-title`, `ve-print-title` → `coac-search`,
  `coac-phases-title`, `coac-print-title` (no son anclas públicas; los de AGENTS.md,
  las fechas y los ids de agrupación **no se tocan**).
- Si se hizo R3, las clases de cada componente pueden pasar a su propio bloque BEM
  (`coac-card__…`), pero en un commit aparte y solo donde salga limpio.
- Prueba: el HTML prerenderizado es idéntico al de R3 salvo el prefijo, y las capturas no cambian.

### R5 · Documentación

- **AGENTS.md**: quitar la app anterior, D, DSEG7, `--mode anterior`/`variant-d` y
  «los tests siguen escritos para la app anterior»; rehacer «Estructura» con las
  carpetas nuevas; cambiar «Solo `src/variants/motion.ts`» por `src/lib/motion.ts`;
  añadir una sección corta **«Probado y descartado»** con lo que sigue valiendo de
  los planes (p. ej. hidratación, `content-visibility`, el JSON se queda tal cual,
  animaciones descartadas y por qué), para no repetir errores.
- **README.md**: árbol de carpetas y comandos al día.
- **CLAUDE.md**, `.claude/skills/nueva-fase/SKILL.md`, `.claude/agents/auditor-legal.md`: se
  quedan (se revisan las rutas).
- **Planes**: los cuatro `PLAN-*.md` se borran del árbol y siguen en
  `archivo/pre-refactor` (AGENTS.md dice cómo leerlos). Lo que aún no está hecho
  pasa a un único `.claude/plans/PENDIENTE.md`: páginas de fases archivadas,
  URL por sesión, Search Console, imagen de compartir por fase, Esc del modal de
  imprimir (~208 ms), abrir fases celebradas desde el pie. Este plan, al acabar,
  también se borra y deja su resumen en `PENDIENTE.md` o en AGENTS.md.
- `.claude/plans/inspiracion-falla/` (4 fotos, 404 kB): ver decisiones.
- `.claude/informes/` no está en git (está en `.gitignore`): no se toca.

### R6 · Ramas y limpieza local (cada borrado remoto, con confirmación)

- Local: borrar `proto/coac` (queda en `archivo/proto-coac`) y el stash (queda en
  `archivo/stash-dominio`); borrar `dist-e2e-motion/` y `test-results/` (se regeneran).
- Origin, fusionadas en `main` y sin nada propio: `feature/luz`, `feature/refactor`,
  `prototipos-ux`, `coac_2025_pre`, `proto/coac`. Se borran solo con tu sí.
- **No se tocan**: `2024Cuartos`, `2024SEMI`, `final2024`, `coac2024`, `2025_COAC_*`,
  `2026_COAC` (archivo de fases pasadas) ni `gh-pages`.

## Orden, tiempo y riesgo

| Fase | Tiempo aprox. | Riesgo | Cambia lo que ve el usuario |
|---|---|---|---|
| R0 Red de seguridad | 2–3 h | bajo | no |
| R1 Borrar lo muerto | 1 h | bajo | no |
| R2 Carpetas por función | 1 h | bajo | no |
| R3 Partir App | 3–4 h | medio (cascada CSS) | no |
| R4 Prefijo | 1 h | bajo (mecánico, con prueba byte a byte) | no |
| R5 Documentación | 1–2 h | nulo | no |
| R6 Ramas | 15 min | nulo (con etiquetas) | no |

Si algo de una fase no cuadra (captura distinta, huella distinta, peso mayor), esa
fase se revierte con `git revert` y se apunta aquí por qué.

## Decisiones del usuario (con recomendación)

1. **R3 (partir App)**: recomendado hacerlo; es la fase con más riesgo y se puede dejar para después.
2. **Prefijo nuevo**: `coac-app` (recomendado) u otro.
3. **Fotos de inspiración del Falla**: moverlas a `.claude/inspiracion-falla/`
   (recomendado: son la referencia de la paleta) o borrarlas (quedan en la etiqueta).
4. **Ramas remotas fusionadas** (R6): borrarlas (recomendado) o dejarlas.
5. **`../coac-quien-canta-hoy`**: es otro repo; si quieres, se trata aparte (archivarlo en GitHub o borrar la copia local, que ocupa 271 MB).
6. **Llevar el refactor a `main`**: solo cuando lo pidas; como no cambia nada visible, puede ir en un solo merge al final.
