# Plan de optimización y mantenibilidad — ¿Quién canta hoy en el COAC?

> Creado el 02/11/2026, antes de preparar la temporada 2027. Objetivo: que la
> lógica de horarios sea correcta y esté testeada, que los componentes sean
> fáciles de tocar de una fase a otra y que la web cargue rápido en el móvil
> con la red saturada del Falla.
>
> **Restricciones (decididas el 02/11/2026):**
> - Se sigue con **React** (nada de Preact).
> - **La web se ve igual y hace lo mismo que ahora**: mismo diseño, mismos
>   textos visibles, mismas secciones, mismo buscador, mismo menú. Solo se
>   arreglan funciones que hoy fallan (p.ej. el "EN DIRECTO" que no avanza).
>   Las ideas que añaden funcionalidad o cambian el aspecto van aparte, en
>   "Ideas fuera de alcance".
> - El formato y el contenido de los JSON de datos **no cambian** (revisado a
>   fondo en la Fase 2b: no hace falta).
>
> **Estado: ejecutado en `feature/refactor` el 02/11/2026, sin commitear
> (pendiente de revisión).** Ver "Resultado de la ejecución" al final.

## Rama de trabajo

Todo el refactor se hace en **`feature/refactor`**, creada como copia de
`main`. `main` no se toca durante el refactor y sigue siendo lo que está
publicado.

```bash
git switch main && git pull
git switch -c feature/refactor
git push -u origin feature/refactor
```

- **Primer commit de la rama**: este plan. Así queda versionado junto al
  trabajo y no en `main`.
- **Segundo commit**: las capturas de referencia de la Fase 0, generadas antes
  de cualquier cambio de código para que reflejen exactamente lo publicado en
  `main`.
- **Commits pequeños y por fase**, con el mismo estilo que el historial
  (mensaje en español). Los renombrados de la Fase 3 van en un commit propio
  (`git mv` sin cambios de lógica) y el formateo con Prettier en otro, para
  que el diff de cada fase sea legible. En cada commit deben pasar `lint`,
  `build` y, desde la Fase 2, `test`.
- **Deploy**: solo desde `main`. Mientras dure el refactor no se ejecuta
  `pnpm run deploy` desde la rama (publicaría en GitHub Pages una versión a
  medias). El workflow de deploy de la Fase 5 se configura para `main`; el de
  CI corre también en `feature/refactor` y en sus PRs.
- **Si hay que tocar `main` mientras tanto** (un dato urgente, por ejemplo): se
  arregla en `main` y se trae a la rama con `git merge main`, sin reescribir el
  historial de la rama.
- **Integración**: PR de `feature/refactor` a `main` cuando estén cerradas las
  fases, con CI en verde y la Fase 0 sin diferencias. Merge normal, sin
  squash: así se conserva el historial de los `git mv` y los commits de cada
  fase. Después del merge, deploy desde `main` y comprobación en la URL
  publicada. Fecha límite: antes de las preliminares de enero de 2027.

## Diagnóstico (medido sobre `main` @ c54dcf2)

| Métrica | Valor | Comentario |
|---|---|---|
| JS (gzip) | 51 KB (157 KB sin comprimir) | ~42 KB son `react-dom`; es el suelo mientras sigamos con React. |
| CSS (gzip) | 4,2 KB | Bien. |
| `index.html` (gzip) | 2,7 KB | Incluye el contenido estático del plugin SEO. Bien. |
| Tests | 0 | Toda la lógica de fechas, sin tests. |
| CI | No hay | Deploy manual con `gh-pages` desde local. |
| Lint / build | Pasan | |

Lo que está bien y no hay que tocar: config única en `season.ts`, HTML estático
generado en build para SEO, JSON-LD, sin router ni estado global. La base es
buena; el plan se centra en correctness, tests y mantenibilidad.

## Problemas detectados

### Bugs y correctness

1. **El "ahora" se congela al cargar la página.** `getCurrentSessionDate` y
   `getLiveGroupIndex` se calculan una sola vez en el render
   ([App.tsx:12](../../src/App.tsx#L12), [DynamicTable.tsx:53](../../src/components/DynamicTable.tsx#L53)).
   Si el usuario deja la pestaña abierta (lo normal: cambia a YouTube y vuelve)
   el "📡 EN DIRECTO" no avanza nunca, y cuando la cuenta atrás llega a 0
   desaparece pero la sesión no pasa a "Sesión de Hoy" hasta recargar.
2. **Zona horaria implícita.** Todo usa la hora local del navegador y de la
   máquina de build. Un usuario en Canarias (UTC‑1 respecto a Cádiz) o fuera
   de España ve mal el directo y la cuenta atrás. El JSON-LD
   ([vite-plugin-seo.ts:103-109](../../vite-plugin-seo.ts#L103-L109)) usa
   `toISOString()` con la zona del build: si algún día se construye en CI
   (UTC), los eventos quedan desplazados 1 h.
3. **Orden de sesiones no garantizado en la app.** El plugin SEO ordena las
   fechas (`sortedDates`), pero `DynamicTable` recorre `Object.entries` en el
   orden del JSON. Hoy los JSON están en orden y no se nota, pero si una sesión
   se añade desordenada, la app y el HTML estático difieren.
4. **Clases Tailwind que no existen** en la versión instalada (3.3.5) y no
   generan CSS: `min-w-16` ([CountdownTimer.tsx:64](../../src/components/CountdownTimer.tsx#L64)),
   `w-15` y `l1` ([SessionCard.tsx:80,96](../../src/components/SessionCard.tsx#L80)),
   `leading-tighter` (varios títulos), `to-grey-400` ([styles.ts:6](../../src/styles.ts#L6)).
   Son ruido: como no aplican nada, **se borran** (no se "arreglan", porque
   hacerlas funcionar cambiaría el aspecto actual).
5. **Ids de ancla frágiles** ([formatAppData.ts:13-15](../../src/utils/formatAppData.ts#L13-L15)):
   se derivan solo del autor y quitan cualquier carácter no ASCII. Si un mismo
   autor lleva dos agrupaciones en una fase, ambas filas comparten `id` y el
   buscador siempre salta a la primera. Hoy no pasa en los datos de 2026,
   pero nada lo impide.
6. **`dateFullFormat` lanza excepciones en el render**
   ([handleDate.ts:42-62](../../src/utils/handleDate.ts#L42-L62)): una clave mal
   escrita en el JSON tumba la página entera (no hay validación de datos).
7. **Accesibilidad sin efecto visual**: el enlace "Pasadas" tiene
   `title="Última Sesión …"` ([MenuHeader.tsx:20](../../src/components/MenuHeader.tsx#L20))
   cuando debería describir las sesiones pasadas; el `aria-label="author"` del
   footer ([Footer.tsx:10](../../src/components/Footer.tsx#L10)) sustituye el
   texto "Nando Muñoz" para lectores de pantalla; los SVG del menú no llevan
   `aria-hidden`.

### Código muerto que volvió

`PLAN-MEJORAS.md` da por borrados estos archivos, pero siguen versionados en
`main`: `my-react-app/`, `docs/`, `favicon.ico` (raíz, duplicado de
`public/`), `src/components/{test,Modal,OnTop,AuthorCloud}.tsx`,
`src/utils/vejer.tsx`, `src/data/CONSTANT_COAC.tsx`,
`src/data/sorpresa.{tsx,gif}` (~390 KB), `src/data/*_test.json`. No entran
en el bundle (nadie los importa), pero los compila `tsc`, confunden a quien
lee el repo y obligan a mantener excepciones en ESLint.

### Mantenibilidad

- `DynamicTable` mezcla lógica de dominio (clasificar sesiones, buscar la
  próxima, calcular el directo) con JSX: construye arrays de elementos dentro
  de un `forEach`. No se puede testear sin renderizar.
- Prop drilling de la config: `previousYearKey`, `sessionStartTime` y
  `minutesPerGroup` bajan de `App` → `DynamicTable` → `SessionCard` solo para
  calcular horas.
- `SessionCard` hace demasiado: cabecera, fila, badge de modalidad, hora
  estimada y enlace al año anterior con ternarias anidadas; usa `key={index}`.
- Convenciones mezcladas: `React.FC` y funciones planas, props en PascalCase
  (`SearchAuthorData`), wrapper `menuData={{…}}`, indentación de 2 y 4
  espacios, comillas simples y dobles. No hay Prettier.
- Strings de clases Tailwind repetidas (el título degradado aparece 5 veces
  con pequeñas variaciones) y SVGs inline de una línea gigante en
  `MenuHeader`.
- `Group.modalidad` es `string`: un typo en el JSON ("COMPARZA") pasa sin aviso
  y pinta el color por defecto.
- El plugin SEO re-implementa a mano el marcado de sesiones en strings HTML;
  cualquier cambio hay que hacerlo dos veces.

### Tooling

- ESLint 8 (sin soporte desde oct‑2024) con `.eslintrc`; typescript-eslint 6.
- `tsc` (sin `-b`) ignora `tsconfig.node.json`, así que `vite.config.ts` no se
  comprueba en el build.
- React 18.2.0 fijado; la última 18.x es 18.3.1 (mismo API, avisos de
  deprecación previos a la 19).
- `package.json`: `"main": "postcss.config.js"` no tiene sentido; el
  `repository` apunta a `quien-canta-hoy-en-el-coac` y el sitio vive en
  `coac-quien-canta-hoy` (revisar cuál es el bueno).

## Fase 0 — Red de seguridad visual (S, ~1-2 h)

Como la regla es "se ve y funciona igual", antes de tocar nada se fija una
referencia y se compara al final de cada fase.

- Test de Playwright (`@playwright/test`, ya se usó para generar los iconos)
  contra `pnpm run preview`, con `page.clock` fijando la hora en varios
  momentos de una temporada de prueba:
  1. antes de la primera sesión (cuenta atrás visible),
  2. sesión de hoy con una agrupación "EN DIRECTO",
  3. madrugada antes de `sessionEndTime` (sigue siendo la sesión de ayer),
  4. fase terminada (solo sesiones pasadas, `<details>` abierto),
  5. buscador con un término escrito.
- `expect(page).toHaveScreenshot()` en móvil (390 px) y escritorio. Las
  capturas de referencia se generan **sobre el `main` actual** y se versionan.
- Para no depender de la fase en curso, el test usa un JSON de fixture
  (`tests/fixtures/sessions.json`) inyectado por una variable de entorno o un
  alias de Vite solo en modo test.

Cualquier diferencia de píxeles en una fase de refactor es un fallo, salvo el
punto 1 de bugs (el directo que avanza), que se valida con su propio test.

## Fase 1 — Limpieza (S, ~1 h)

- Borrar todo lo listado en "Código muerto que volvió".
- Quitar `my-react-app` y `docs` de `ignorePatterns` en ESLint.
- Arreglar `package.json` (`main`, `repository`, `engines.node`).
- Borrar las clases inexistentes del punto 4 de bugs y las constantes sin uso
  de `styles.ts` (`classNameGradientHigh`, `classNameGradientDisable`).
- La limpieza de `CLAUDE.md`, `AGENTS.md` y `.claude/plans/` va en la Fase 6.

## Fase 2 — Dominio puro + tests ⭐ (M, ~4 h)

La pieza clave: sacar toda la lógica de horarios a funciones puras que reciban
`now` como parámetro, y testearlas. Sin cambios visuales.

1. **Funciones puras con `now` explícito** en `src/domain/schedule.ts`:
   ```ts
   getActiveSessionDate(now: Date, sessionEndTime: string): string
   getLiveGroupIndex(now: Date, startTime: string, minutesPerGroup: number, count: number): number | null
   ```
   y una función que construya todo lo que la UI necesita:
   ```ts
   buildSchedule(sessions: SessionsData, now: Date, season: SeasonConfig): {
     past: SessionView[]; present: SessionView | null; future: SessionView[];
     nextSession: { date: string; startsAt: Date } | null;
   }
   // SessionView = { date, label, groups: { ...Group, estimatedTime, isLive }[] }
   ```
   Ordena las fechas (bug 3) y la usan tanto la app como el plugin SEO.
2. **Zona horaria fija `Europe/Madrid`.** Un helper (`madridParts(now)` con
   `Intl.DateTimeFormat(..., { timeZone: "Europe/Madrid" }).formatToParts`)
   para saber "qué hora es en Cádiz" y otro que convierta fecha+hora de Cádiz
   a un instante absoluto (cuenta atrás y JSON-LD). `timeZone` va en `SITE`.
   Arregla el bug 2. Para un usuario en la Península no cambia nada.
3. **Hook `useNow(intervalMs = 30_000)`** en `src/hooks/useNow.ts`: actualiza
   cada 30 s y también en `visibilitychange` (al volver de YouTube). `App` lo
   usa y pasa `now` a `buildSchedule` (con `useMemo`). Arregla el bug 1: el
   "EN DIRECTO" avanza y, al acabar la cuenta atrás, la sesión pasa a "hoy"
   sin recargar, exactamente como se ve hoy al recargar.
4. **Validación de datos** `validateSessions(data, season)`: claves
   `dd/mm/yyyy` válidas, `modalidad` y `ranking` dentro de sus uniones, ids
   únicos, autor y nombre no vacíos. Se ejecuta en el plugin SEO
   (`buildStart`) para que **un JSON mal escrito rompa el build, no la web**,
   y en los tests. Con eso `formatLongDate` (antes `dateFullFormat`) deja de necesitar `throw`.
5. **Ids robustos**: `slug(autor)` normalizando acentos (`normalize("NFD")`),
   con sufijo si se repite. Los ids no se ven; solo cambian las anclas
   internas que usa el buscador.
6. **Tipos**: `Modalidad = "CORO" | "COMPARSA" | "CHIRIGOTA" | "CUARTETO"`;
   `modalidadColors: Record<Modalidad, string>`; `SeasonConfig` exportado.
7. **Vitest** (`pnpm add -D vitest`, script `test`) con `TZ=UTC` forzado para
   demostrar que el resultado no depende de la zona de la máquina. Casos
   mínimos: sesión que cruza medianoche, `sessionEndTime` 04:00 vs 09:00,
   antes de empezar / durante / después, validación de un JSON con errores, y
   que todos los `src/data/*.json` pasan la validación.

## Fase 2b — Datos JSON (S, ~1-2 h)

### Auditoría (02/11/2026, fases PRE/CUARTOS/SEMI/FINAL de 2026)

- 223 agrupaciones en total; **todas** tienen exactamente los mismos 6 campos
  (`2025`, `ranking`, `modalidad`, `nombre`, `autor`, `ciudad`), todos string,
  ninguno vacío. `modalidad` y `ranking` solo usan valores válidos.
- Entre fases, cada agrupación conserva los mismos datos (autor, ciudad,
  ranking, año anterior), con una sola excepción: ver "Detalles para revisar".
- Los únicos puntos débiles del formato están en cómo lo consume el código, no
  en el JSON:
  - La clave del año anterior es dinámica (`"2025"`), y por eso `Group` lleva
    un índice `[key: string]: string | undefined` que deja pasar cualquier
    campo mal escrito (`group.autr` compila).
  - `"Nueva agrupación"` es un texto centinela que se compara a mano en la app
    y en el plugin SEO.

### Decisión: el JSON se queda tal cual

Cambiar el formato (clave fija `"anterior"`, catálogo único de agrupaciones
con el orden por fase, etc.) obligaría a reescribir los 4 archivos y a
cambiar el proceso de copiar el listado oficial en cada fase, a cambio de
poco. Las mejoras se hacen en código:

1. **Adaptador de carga** `src/domain/loadSessions.ts`: convierte cada
   registro del JSON en un tipo estricto, sin perder ningún campo:
   ```ts
   interface Group {
     ranking: RankingKey; modalidad: Modalidad; nombre: string;
     autor: string; ciudad: string; id: string;
     previous: { year: number; name: string } | { year: number; isNew: true };
   }
   ```
   `previous.year` sale de `SEASON.previousYear`, así que el dato "2025" se
   conserva. Desaparece el índice dinámico de `Group` y el texto "Nueva
   agrupación" se compara en un único sitio. La app y el plugin SEO usan solo
   este adaptador.
2. **JSON Schema** `src/data/coac-session.schema.json` (fechas `dd/mm/yyyy`
   como claves, enums de `modalidad`/`ranking`, campos obligatorios) asociado
   a `src/data/COAC_*.json` en `.vscode/settings.json` (`json.schemas`):
   autocompletado y errores en el editor al preparar la siguiente fase, **sin
   añadir nada a los JSON**. Hay que añadir `!.vscode/settings.json` al
   `.gitignore`. La validación del build (`validateSessions`, Fase 2) y el
   schema comprueban las mismas reglas.
3. **Archivar fases pasadas**: los JSON de 2026 (`PRE`, `CUARTOS`, `SEMI`)
   pasan a una rama `2026_COAC` al empezar 2027, como en años anteriores. Los
   `*_test.json` se borran en la Fase 1 (son copias antiguas: el de 2026 tiene
   los 124 ids repetidos).

### Detalles para revisar (no se tocan sin tu visto bueno)

Son datos, no formato; se dejan como están salvo que decidas otra cosa:

- Doble espacio en `"García Argüez (Chapa)  y Raúl Cabrera"` (PRE y CUARTOS).
- "Los compay" (PRE) vs "Los Compay" (CUARTOS/SEMI), y su autor pasa de
  `"M. Benítez Molina, Fco Macías Tinoco y Gonzalo Madrid"` a `"chirigota de
  los Molina"`. Como el id de ancla se genera a partir del autor, esa
  agrupación tiene un id distinto en cada fase.
- Ciudades escritas de dos formas: "Conil" / "Conil de la Frontera",
  "Sanlúcar" / "Sanlúcar de Barrameda"; y abreviadas: "Sta Cruz de Tenerife",
  "S. Juan de Aznalfarache", "Puerto Llano" (¿Puertollano?).

## Fase 3 — Refactor y renombrado de componentes (M, ~4 h)

Objetivo: componentes que solo pintan un `SessionView`, sin lógica de fechas
dentro, y con nombres que digan lo que hacen. **Mismo DOM visible y mismas
clases Tailwind** (lo comprueba la Fase 0).

### Renombrados

Criterio: el nombre describe la **función**, no el aspecto ni la
implementación ("Card", "Table", "Dynamic", "handle", "format…Data" no dicen
qué hacen). Identificadores en inglés como ahora; los términos del dominio que
vienen del JSON (`modalidad`, `autor`, `nombre`, `ciudad`) se mantienen en
español para que coincidan con los datos.

**Componentes**

| Actual | Nuevo | Qué hace |
|---|---|---|
| `<header>` dentro de `App` | `SiteHeader` | Título con año y fase. |
| `MenuHeader` | `BottomNav` | Barra de navegación fija **inferior**; no es un header. |
| `DynamicTable` | `SessionSchedule` | Reparte las sesiones en hoy / próximas / pasadas y muestra la cuenta atrás. No es una tabla ni es "dinámica". |
| `SessionCard` | `SessionLineup` | Orden de actuación de una sesión. |
| fila dentro de `SessionCard` | `PerformanceRow` | Una actuación: modalidad, hora estimada o "EN DIRECTO", ciudad, autor, nombre y año anterior. |
| `<span>` de modalidad | `ModalidadBadge` | Chip de color por modalidad. |
| ternaria del año anterior | `PreviousYearLink` | Enlace a YouTube con la agrupación del año anterior, o "Es una nueva agrupación". |
| `CountdownTimer` | `NextSessionCountdown` | Cuenta atrás a la próxima sesión (es su único uso). |
| `SearchAuthor` | `AuthorSearch` | Buscador por autor (sustantivo, como el resto). |
| `Footer` | `SiteFooter` | Pie con autoría y licencia (pareja de `SiteHeader`). |
| títulos repetidos | `GradientHeading` | Título con el degradado de la marca. |

**Módulos y funciones**

| Actual | Nuevo | Motivo |
|---|---|---|
| `utils/handleDate.ts` | `lib/dates.ts` (parseo, formato, zona horaria) + `domain/schedule.ts` (lógica de sesiones) | "handle" no dice nada; mezcla utilidades genéricas con reglas del COAC. |
| `getCurrentSessionDate` | `getActiveSessionDate` | Devuelve la sesión activa, que de madrugada es la del día anterior. |
| `parseDate` | `parseSessionDate` | Solo parsea el formato `dd/mm/yyyy` de las claves del JSON. |
| `dateFullFormat` | `formatLongDate` | Verbo primero, como el resto. |
| `buildSessionDateTime` | `getSessionStart` | Devuelve el instante de inicio de una sesión. |
| `estimateGroupTime`, `getLiveGroupIndex` | sin cambios | Ya describen lo que hacen. |
| `utils/formatAppData.ts` · `formatAppData` | `domain/loadSessions.ts` · `loadSessions` | No formatea: carga, tipa y asigna ids (Fase 2b). |
| `utils/handleYoutube.ts` · `generateUrlYoutube` | `lib/youtube.ts` · `youtubeSearchUrl` | Devuelve la URL de una búsqueda en YouTube. |
| `cssRanking` (en `SessionCard`) | `rankingRowClass` en `styles.ts` | Junto al resto de clases por dato (`modalidadColors`). |
| `classNameBoxActive`, `classNameGradient` | `activeSessionClass`, `brandGradientClass` | Por uso, no por aspecto. |

**Props**

| Actual | Nuevo | Motivo |
|---|---|---|
| `currentSession` (`DynamicTable`) y `lastDateSession` (`MenuHeader`) | `activeSessionDate` en los dos | Eran el mismo dato con dos nombres; "last" es engañoso (es la activa, no la última). |
| `menuData={{ liveUrl, lastDateSession }}` | `liveUrl`, `activeSessionDate` | Sin objeto wrapper. |
| `SearchAuthorData` | `sessions` | camelCase y sin repetir el nombre del componente. |
| `data` (`DynamicTable`) | `schedule` | Recibe el resultado de `buildSchedule`, no los datos crudos. |
| `isCurrentSession` + `isPastSession` | `status: SessionStatus` | Un solo campo en vez de dos booleanos que pueden contradecirse. |

**Lo que no se renombra**: los ids del DOM (`siteHeader`, `siteMain`,
`searchAuthor`, `session-present`, `session-future`, `session-past`, las
fechas y los ids de agrupación) y las clases `coac-session` y `blinking`,
porque los usan las anclas del menú y los enlaces que se hayan compartido.

**Cómo**: un commit solo de renombrados (`git mv` + actualizar imports, sin
cambios de lógica) antes del refactor interno, para que el historial siga
cada archivo y la Fase 0 confirme que nada cambia.

### Estructura resultante

```
src/
  components/
    layout/      SiteHeader, BottomNav, SiteFooter
    schedule/    SessionSchedule, SessionLineup, PerformanceRow,
                 ModalidadBadge, PreviousYearLink, NextSessionCountdown
    search/      AuthorSearch
    ui/          GradientHeading, icons.tsx
  hooks/         useNow.ts
  domain/        schedule.ts, loadSessions.ts, validate.ts, ids.ts,
                 filterByAuthor.ts (+ *.test.ts)
  lib/           dates.ts, youtube.ts
  config/        season.ts, site.ts
  types.ts, styles.ts
```

### Cambios por componente

- **`SiteHeader`**: sacar el `<header>` de `App.tsx` tal cual.
- **`SessionSchedule`**: recibe el resultado de `buildSchedule` y solo decide
  qué bloque pintar (cuenta atrás, hoy, próximas, pasadas).
- **`SessionLineup`** → un `PerformanceRow` por agrupación,
  `key={group.id}`. `PerformanceRow` recibe `estimatedTime` e `isLive` ya
  calculados; se acaba el prop drilling de `sessionStartTime`/
  `minutesPerGroup`. `React.memo` en `SessionLineup` para que el tick de
  `useNow` no repinte las sesiones pasadas/futuras. Se mantienen los
  `div`/`article` actuales; si se quiere pasar a `<ol>/<li>` por semántica,
  solo si la captura sale idéntica (preflight de Tailwind ya quita los estilos
  de lista).
- **`PreviousYearLink`**: sustituye la ternaria anidada; usa
  `group.previous` del adaptador (Fase 2b).
- **`GradientHeading`** (`as="h2" | "h3"`, `className` extra) que reproduce
  exactamente las clases de cada uno de los 5 títulos actuales; o bien
  `@layer components` en `index.css` (`.title-gradient`), que además puede
  usar el plugin SEO.
- **`BottomNav`**: los mismos 4 enlaces, en el mismo orden y con el mismo
  aspecto, definidos como array de datos; iconos en `icons.tsx` con
  `aria-hidden`; contenedor `<nav aria-label="…">` en lugar del `div` (mismas
  clases). Corrige el `title` de "Pasadas".
- **`AuthorSearch`**: mismo comportamiento (filtra por autor, mismos chips de
  resultado). El filtrado pasa a `domain/filterByAuthor.ts`, testeable.
- **`SiteFooter`**: quitar el `aria-label="author"`.
- **Convenciones**: funciones con props tipadas en vez de `React.FC`, props en
  camelCase, sin objetos wrapper. Prettier + `.editorconfig` y un único commit
  de formateo (para no mezclarlo con cambios reales).
- **Plugin SEO**: reutilizar `buildSchedule`, `loadSessions` y
  `validateSessions`. Opcional (evaluar coste): generar el HTML estático con
  `renderToStaticMarkup` de los mismos componentes en vez de strings a mano,
  para que el marcado viva en un solo sitio.

## Fase 4 — Rendimiento con React (S-M, ~2 h)

Medir antes y después con Lighthouse móvil (throttling 4G lenta) sobre
`pnpm run preview`. Con React, el JS no baja mucho de los ~51 KB gzip; las
ganancias están en no hacer trabajo de más y en que el primer pintado sea
estable.

1. **Evitar renders innecesarios**: con `useNow` la app re-renderiza cada
   30 s; `React.memo` en `SessionLineup`, datos cargados (`loadSessions`)
   una vez a nivel de módulo, y `NextSessionCountdown`
   aislado para que su tick de 1 s solo repinte la cuenta atrás (ya es así;
   mantenerlo).
2. **Salto al arrancar React (CLS)**: el HTML estático del plugin (lo que ve
   el usuario durante el primer instante antes de que cargue el JS) tiene una
   estructura distinta a la app y `createRoot` lo sustituye de golpe. Hacer
   que el HTML estático reserve los mismos huecos (cabecera con las mismas
   clases, hueco del buscador, bloques de sesión). La app final no cambia;
   solo se suaviza la transición.
3. **Partir el bundle**: separar `react`/`react-dom` en un chunk propio
   (`build.rollupOptions.output.manualChunks`) para que, al cambiar de fase,
   el navegador reutilice de caché el chunk de React (cambia muy poco) y solo
   descargue el de la app + datos.
4. **Pequeños sin efecto visual**: `content-visibility: auto` en los
   `SessionLineup` futuros; comprimir `icon-512.png` (149 KB, solo se descarga
   al instalar); `scroll-behavior: smooth` en `html` en lugar de en `*`
   (mismo efecto, menos coste de estilo).

## Fase 5 — Tooling y CI (M, ~2-3 h)

- **GitHub Actions**:
  - `ci.yml` en cada push/PR: `pnpm install --frozen-lockfile`, `lint`,
    `typecheck`, `test`, `build` y el test visual de la Fase 0.
  - `deploy.yml` en push a `main`: build + `actions/deploy-pages` con
    `TZ=Europe/Madrid`. Sustituye a `pnpm run deploy` desde local (y a la
    dependencia `gh-pages`); el `lastmod` del sitemap pasa a ser el del deploy
    real. Requiere cambiar en GitHub Pages la fuente a "GitHub Actions".
- Scripts: `"typecheck": "tsc -b"` (comprueba también `vite.config.ts`),
  `"test": "vitest run"`, `"test:visual": "playwright test"`,
  `"format": "prettier --write ."`.
- **ESLint 9 flat config** (`eslint.config.js`) + typescript-eslint 8 +
  `eslint-plugin-react-hooks` actual + `eslint-plugin-jsx-a11y`.
- Actualizar dependencias de forma escalonada y comprobando la Fase 0 tras
  cada salto: React 18.2 → 18.3.1, Vite 5 → actual, TypeScript a la última
  versión que soporte typescript-eslint, Tailwind 3.3 → 3.4 (ojo: en 3.4
  `min-w-16` sí existe, por eso se borra en la Fase 1 antes de subir).
- Dependabot o Renovate mensual para devDependencies.

## Fase 6 — Documentación y configuración para agentes de IA (S-M, ~2 h)

La app no usa IA; esta fase va de la configuración que leen los agentes
(Claude Code y otros que leen `AGENTS.md`) al trabajar en el repo.
`CLAUDE.md` + `AGENTS.md` se cargan en **cada** sesión, así que cada línea
desactualizada cuesta tokens y lleva a errores.

### Estado actual y deuda

- `CLAUDE.md` dice "Plan de mejoras pendiente: `.claude/plans/PLAN-MEJORAS.md`", pero
  ese plan se ejecutó el 18/07/2026. Un agente que lo siga intentará rehacer
  trabajo hecho. Además es el único contenido propio de `CLAUDE.md`, aparte de
  la importación de `AGENTS.md`.
- `.claude/plans/PLAN-MEJORAS.md` (130 líneas) y `.claude/plans/PLAN-SEO.md` (138) son registros
  de trabajo ya hecho, con referencias a líneas que ya no existen
  (`DynamicTable.tsx:46`, `CONSTANT_COAC_2025`, `group['2024']`…). Además,
  PLAN-MEJORAS da por borrados archivos que siguen en `main`. Son trampas
  para un agente que los lea como estado actual.
- `AGENTS.md` repite lo que ya está en `README.md` (comandos, chuleta de
  3 pasos) y mezcla reglas con historia (cómo se generó `og-image.png`).
  Le faltan cosas que un agente necesita y no deduce del código:
  - qué carpetas son código muerto (hasta la Fase 1),
  - cómo comprobar un cambio (hoy solo `lint` + `build`),
  - que `pnpm deploy` no es lo mismo que `pnpm run deploy`,
  - que el resolutor de Vite resuelve `.tsx` antes que `.ts` (el build se
    rompió por tener `handleDate.ts` y `handleDate.tsx` a la vez),
  - las restricciones de este plan (React, no cambiar el aspecto, no tocar el
    contenido de los JSON).
- No hay `.claude/settings.json`: cada `pnpm run lint/build` pide permiso, y
  nada impide que un agente lance `pnpm run deploy` (publica en producción).
- La tarea que más se repite (cambiar de fase) no tiene un flujo guiado: el
  agente tiene que reconstruirlo cada vez a partir de README y AGENTS.

### Tareas concretas

1. **`CLAUDE.md`** → una sola línea, `@AGENTS.md`, sin contenido propio.
   `AGENTS.md` es la única fuente de instrucciones. `CLAUDE.md` no se borra
   porque Claude Code solo carga `CLAUDE.md` automáticamente: sin ese puente,
   dejaría de leer `AGENTS.md` (Codex, Cursor y otros sí leen `AGENTS.md`
   directamente). El puntero al plan en curso pasa a `AGENTS.md`.
2. **`AGENTS.md`**, reescrito y más corto (objetivo: ~60 líneas):
   - Fuera: los comandos y la chuleta de cambio de fase (se enlaza a
     `README.md`) y la historia del `og-image` (pasa a un comentario en
     `public/` o al histórico).
   - Dentro, como reglas cortas: los avisos de la lista anterior, la zona
     horaria `Europe/Madrid`, "el JSON se carga solo por
     `domain/loadSessions.ts`" (Fase 2b) y "cómo verificar": `pnpm run lint &&
     pnpm run typecheck && pnpm run test && pnpm run build`, más
     `pnpm run test:visual` si se toca algo de UI.
   - La sección "Estructura" se actualiza al terminar la Fase 3 (no antes,
     para que no describa archivos que todavía no existen).
3. **`.claude/plans/`**: borrar `PLAN-MEJORAS.md` y `PLAN-SEO.md` (siguen en el
   historial de git) y pasar a `AGENTS.md` solo las decisiones que siguen
   vigentes, sin números de línea:
   - por qué `createRoot` y no hidratación,
   - por qué `vite-plugin-seo.ts` está en `tsconfig.json`,
   - que las temporadas pasadas se archivan en ramas,
   - que el HTML estático no es cloaking.
   Al terminar este plan, hacer lo mismo con `PLAN-OPTIMIZACION.md`.
4. **`.claude/settings.json`** versionado:
   - `allow`: `pnpm run lint`, `pnpm run typecheck`, `pnpm run test*`,
     `pnpm run build`, `pnpm run dev`, `pnpm run preview`, `git status/diff/log`.
   - `deny`: `pnpm run deploy`, `pnpm deploy` y `git push` a `gh-pages` (el
     deploy lo hace el workflow de la Fase 5 o una persona).
   - `.claude/settings.local.json` en `.gitignore` para preferencias
     personales.
5. **Skill del proyecto `.claude/skills/nueva-fase/SKILL.md`** para la tarea
   recurrente, en pasos que se puedan comprobar:
   1. crear `src/data/COAC_<año>_<FASE>.json` copiando el formato,
   2. ejecutar la validación (`pnpm run test`) y corregir lo que diga,
   3. actualizar `src/config/season.ts` (import, `phaseTitle`, horas,
      `minutesPerGroup`),
   4. `pnpm run build` y revisar `dist/index.html` (título, JSON-LD con las
      fechas nuevas),
   5. commit y push a `main` (deploy por Actions); nunca deploy manual.
   Un agente con la skill hace el cambio de fase sin tener que leer todo el
   repo.
6. **`README.md`**: el paso 3 de la chuleta pasa a ser "push a `main`"; añadir
   cómo correr los tests.

## Orden sugerido y prioridades

| Prioridad | Fase | Esfuerzo | Por qué |
|---|---|---|---|
| 1 | Fase 0 — Red visual | S | Garantiza que nada cambia de aspecto en el resto de fases. |
| 2 | Fase 1 — Limpieza | S | Despeja el terreno para todo lo demás. |
| 3 | Fase 2 — Dominio + tests | M | Arregla los bugs reales (directo congelado, zona horaria, orden) y blinda los datos. |
| 3b | Fase 2b — Datos | S | Tipos estrictos y schema en el editor, sin tocar los JSON. |
| 4 | Fase 3 — Componentes | M | Más fácil y seguro una vez la lógica está fuera y testeada. |
| 5 | Fase 5 — CI/deploy | M | Evita desplegar un build roto y saca el deploy del portátil. |
| 6 | Fase 4 — Rendimiento | S-M | Mejoras incrementales, medidas con Lighthouse. |
| 7 | Fase 6 — Docs y config de IA | S-M | Tareas 1, 3 y 4 al principio (corrigen información falsa y bloquean el deploy manual); 2, 5 y 6 al final, cuando la estructura ya es la definitiva. |

Todo debería estar listo **antes de las preliminares de enero de 2027**: con la
temporada en marcha solo se tocan datos.

## Ideas fuera de alcance

Cambian el aspecto o añaden funcionalidad, así que quedan fuera de este plan.
Se apuntan para decidir más adelante:

- Buscador sin acentos ("garcia" → "García") y también por agrupación/ciudad,
  con estado "Sin resultados".
- "Sesión hoy" del menú que se oculte o lleve a la cuenta atrás cuando no hay
  sesión hoy (hoy apunta a un ancla inexistente).
- PWA offline (`vite-plugin-pwa`) para consultar el orden sin cobertura en el
  teatro.
- Respetar `prefers-reduced-motion` (parpadeo del "EN DIRECTO" y scroll
  suave).
- Hacer funcionar las clases que hoy no aplican (`min-w-16`, etc.).
- Preact, React 19, Tailwind 4, router, SSR o frameworks (Next, Astro).
- Cambiar el formato de los JSON.

## Resultado de la ejecución (02/11/2026)

Verificado: `lint`, `format:check`, `typecheck`, `test` (55 tests unitarios),
`build` y `test:visual` (18 pruebas: 12 capturas idénticas píxel a píxel a las
de `main` + 6 de comportamiento) en verde.

| Fase | Estado | Notas |
|---|---|---|
| 0 — Red visual | Hecha | Playwright 1.63.0 (la que usa el Chromium ya en caché). Capturas generadas sobre el código de `main` antes de tocar nada. |
| 1 — Limpieza | Hecha | `package.json` apunta ya al repo correcto (`coac-quien-canta-hoy`). El CSS bajó de 18,5 a 15 KB. |
| 2 — Dominio + tests | Hecha | `getLiveGroupIndex` recibe el instante de inicio de la sesión (no la hora de inicio): a mediodía ya no marca "en directo" una agrupación de la sesión de ayer en sesiones largas. Los 3 tests de reloj fallan si se desactiva `useNow`. |
| 2b — Datos | Hecha | Sin tocar ningún JSON. Schema + `.vscode/settings.json`. Los detalles de contenido siguen pendientes de decisión. |
| 3 — Componentes | Hecha | Renombrados con `git mv`. Se mantiene `div`/`article` (no `<ol>`). Plugin SEO reutiliza `SiteHeader`; el resto del HTML estático sigue siendo string (ver abajo). |
| 4 — Rendimiento | Parcial | Hecho: `memo` con comparador, vendor chunk de React (app 7 KB gzip + React 45 KB cacheado), `scroll-behavior` en `html`, cabecera estática idéntica. Sin hacer: `content-visibility` (puede mover las anclas sin `contain-intrinsic-size`), compresión de `icon-512.png` (no hay herramienta instalada), HTML estático completo con los mismos componentes (el estado "hoy/pasadas" depende de la hora de build). Sin medir con Lighthouse. |
| 5 — Tooling y CI | Hecha, con cambios | Vite 7, ESLint 9 (flat) + `jsx-a11y`, TypeScript 5.9, Tailwind 3.4, React 18.3.1, Prettier. `tsconfig.node.json` eliminado: un único `tsconfig.json` cubre app, plugin, config y tests. Workflows escritos pero **sin ejecutar** (no hay Actions en local). `test:visual` **no** está en CI: las capturas son de Linux local y las fuentes del runner darían diferencias. |
| 6 — Docs e IA | Hecha | `AGENTS.md` reescrito, `CLAUDE.md` = `@AGENTS.md`, `.claude/settings.json`, skill `nueva-fase`. `PLAN-MEJORAS.md` y `PLAN-SEO.md` borrados (siguen en el historial de git). |

### Antes de integrar en `main`

1. En GitHub: Settings → Pages → fuente **GitHub Actions** (se quitó `gh-pages`
   y el script `deploy`; sin esto el deploy automático no publica).
2. Probar `ci.yml` y `deploy.yml` en el primer push de la rama.
3. Decidir qué hacer con los detalles de contenido de la Fase 2b.
4. Al terminar, borrar este plan o moverlo al historial.
