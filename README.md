<div align="center">

<a href="https://coac.com.es/">
  <img src="public/og-image.jpg" alt="¿Quién canta hoy en el Falla? Aunque no seamos la web oficial, puedes ver los horarios de las preliminares del COAC." width="100%">
</a>

[![CI](https://github.com/nandovejer/coac/actions/workflows/ci.yml/badge.svg)](https://github.com/nandovejer/coac/actions/workflows/ci.yml)
[![Deploy](https://github.com/nandovejer/coac/actions/workflows/deploy.yml/badge.svg)](https://github.com/nandovejer/coac/actions/workflows/deploy.yml)
[![Licencia: MIT](https://img.shields.io/badge/licencia-MIT-2365a6)](./LICENSE)
[![Hecho con Luz](https://img.shields.io/badge/hecho%20con-Luz-2365a6)](https://github.com/nandovejer/luz)
![Sin backend](https://img.shields.io/badge/backend-ninguno-2365a6)

[Qué es](#qué-es) ·
[Funciones](#funciones) ·
[Cómo funciona](#cómo-funciona) ·
[Desarrollo](#desarrollo) ·
[Nueva fase](#actualizar-a-una-nueva-fase-3-pasos) ·
[Web](https://coac.com.es/)

</div>

---

## Qué es

**¿Quién canta hoy en el COAC?** responde a la pregunta que se hace todo el
mundo durante el Carnaval de Cádiz: _¿qué agrupación sale ahora y cuándo me
toca verla?_

El COAC (Concurso Oficial de Agrupaciones Carnavalescas, en el Gran Teatro
Falla) dura semanas, con una sesión por noche y más de una decena de
agrupaciones en cada una. El listado oficial es una tabla larga y sin horas. Esta
web lo convierte en una página que se abre en el móvil y dice, de un vistazo:

- qué sesión es la de **hoy**, cuáles vienen y cuáles ya pasaron;
- a qué **hora aproximada** sale cada agrupación;
- cuál está **en directo ahora mismo**;
- cuánto falta para la próxima sesión, si hoy no hay.

Es una web estática, sin cuentas, sin cookies y sin servidor: se abre, se mira y
se cierra.

## Funciones

| Función               | Qué hace                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Sesión de hoy**     | Destaca la sesión en curso y marca «en directo» la agrupación que debería estar actuando.                                 |
| **Horario estimado**  | Calcula la hora de cada agrupación a partir del orden de actuación (actuación + montaje). Son estimaciones, no oficiales. |
| **Cuenta atrás**      | Cuando no hay sesión hoy, muestra el tiempo que falta para la siguiente.                                                  |
| **Buscador**          | Filtra por autor y lleva a la agrupación dentro de su sesión.                                                             |
| **Directo**           | Enlace a la emisión en YouTube y al vídeo del año anterior de cada agrupación.                                            |
| **Tres modos**        | Claro, oscuro y alto contraste. El oscuro y el de alto contraste cumplen WCAG AA.                                         |
| **Visible sin JS**    | El contenido real va dentro del HTML, para buscadores y lectores sin JavaScript (datos estructurados JSON-LD incluidos).  |
| **Siempre a la hora** | Todas las horas son de `Europe/Madrid`, estés donde estés.                                                                |

## Cómo funciona

```text
src/data/COAC_<año>_<FASE>.json   listado oficial: fecha → agrupaciones, en orden
        │
        ▼
src/domain/                       lógica pura y testeada: sesión activa,
        │                         hora estimada, agrupación en directo
        ▼
src/components/                   React: solo pintan, con CSS propio
        │
        ▼
vite-plugin-seo.ts                en el build, HTML real en #root, metadatos,
                                  JSON-LD y sitemap
```

Todo se sirve estático desde GitHub Pages. La hora actual se refresca cada 30
segundos y al volver a la pestaña.

### Tecnología

| Pieza            | Uso                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| **Luz**          | Sistema de diseño: [`@luz-ds/*`](https://github.com/nandovejer/luz) (tokens, base y selector de modo) con tema propio `coac`. |
| React 18         | Interfaz, sin router ni estado global.                                                              |
| Vite + TypeScript | Build, tipado y plugin propio de SEO.                                                              |
| CSS propio       | Un `.css` por componente, con tokens de Luz. Sin Tailwind ni utilidades.                            |
| Vitest           | Tests de la lógica de fechas, datos y contraste.                                                    |
| Playwright + axe | Capturas, modos de color, reloj simulado y accesibilidad.                                           |
| GitHub Actions   | CI en cada PR y deploy a GitHub Pages al subir a `main`.                                            |

Hecho con [Luz](https://github.com/nandovejer/luz), el sistema de diseño en
CSS plano de [Nando Muñoz](https://twitter.com/nandovejer).

> [!NOTE]
> **Luz está en beta.** `@luz-ds/*` está fijado a una versión exacta. Lee su
> [CHANGELOG](https://github.com/nandovejer/luz/blob/main/packages/tokens/CHANGELOG.md)
> y revisa las capturas antes de subirla.

## Desarrollo

Necesitas Node 20 o superior y [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm run dev          # servidor de desarrollo
```

| Comando                         | Para qué                                                      |
| ------------------------------- | ------------------------------------------------------------- |
| `pnpm run lint`                 | ESLint                                                        |
| `pnpm run format`               | Prettier (`format:check` solo comprueba)                      |
| `pnpm run typecheck`            | `tsc`                                                         |
| `pnpm run test`                 | Tests unitarios (Vitest)                                      |
| `pnpm run check:contrast`       | Contraste WCAG del tema de Luz en los 3 modos                 |
| `pnpm run lint:luz`             | `luz-check` sobre el HTML (`dist/`) y el CSS                  |
| `pnpm run test:visual`          | Capturas, modos de color y axe (Playwright, local)            |
| `pnpm run test:visual:compare`  | Imágenes antes \| después \| diferencias                      |
| `pnpm run build`                | `tsc` + build de producción a `dist/`                         |
| `pnpm run deploy`               | Relanza el deploy de `main` en GitHub Actions (necesita `gh`) |

`test:visual` necesita Chromium (`pnpm exec playwright install chromium`).
Compara contra capturas de Linux: si cambias el aspecto a propósito, revisa
`pnpm run test:visual:compare` y regénera con `pnpm run test:visual:update`.

## Actualizar a una nueva fase (3 pasos)

1. Crea `src/data/COAC_<año>_<FASE>.json` con el mismo formato que el actual
   (claves `dd/mm/yyyy` → array de agrupaciones). `pnpm run test` lo valida.
   Si hay plantilla en `src/data/plantillas/` (fechas de la fase ya puestas),
   rellénala y muévela a `src/data/`.
2. Edita `src/config/season.ts`: cambia el import del JSON y ajusta
   `phaseTitle`, `previousYear` (si toca) y las horas de sesión si cambian.
3. Haz push a `main`: GitHub Actions comprueba y publica en GitHub Pages
   (`pnpm run deploy` solo lo vuelve a lanzar, no sube nada desde tu máquina).

Las fechas de cada sesión **no** se declaran a mano en ningún sitio: se
derivan directamente de las claves del JSON.

> [!IMPORTANT]
> GitHub Pages debe estar configurado con la fuente **GitHub Actions**
> (Settings → Pages → Build and deployment).

Las temporadas pasadas se archivan en ramas (`2025_COAC_PRE`, `coac2024`…).
Más contexto del proyecto, reglas y decisiones en [AGENTS.md](AGENTS.md).

## Licencias

- **Código** (`src/`, `scripts/`, `tests/` y la configuración): [MIT](./LICENSE).
  Incluye el diseño visual y el logo de la fachada.
- **Datos** (`src/data/`): los nombres de agrupaciones, autores, ciudades y el
  orden de actuación proceden del listado oficial del COAC, publicado por el
  Ayuntamiento de Cádiz, y **no** están cubiertos por la licencia MIT. Las
  valoraciones (`ranking`) son opinión del autor de esta web, no del jurado ni de
  la organización.
- **Fuente DSEG** (`tests/fixtures/dseg/`): © keshikan, SIL Open Font License 1.1
  (ver `DSEG-LICENSE.txt`).
- **Dependencias**: cada una con su licencia. `pnpm run build` genera
  `public/THIRD-PARTY-LICENSES.txt` con el aviso y el texto de cada una, y la web
  lo enlaza desde «Quiénes somos» y el pie.
- «¿Quién canta hoy en el COAC?» es el nombre del proyecto. «COAC» y «Carnaval de
  Cádiz» se usan solo para nombrar el concurso. La web no es oficial y no tiene
  relación con el Ayuntamiento de Cádiz ni con la organización.
