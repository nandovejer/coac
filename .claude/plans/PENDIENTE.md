# Pendiente y descartado

Lo que sigue abierto de los planes ya cumplidos (Luz, optimización, animaciones y
SEO + rendimiento), que se borraron el 12/11/2026. Siguen enteros en la etiqueta
`archivo/pre-refactor`:

```bash
git show archivo/pre-refactor:.claude/plans/PLAN-ANIMACIONES.md
```

(también `PLAN-LUZ.md`, `PLAN-OPTIMIZACION.md` y `PLAN-SEO-RENDIMIENTO.md`).

## Pendiente de decisión del usuario

- **Páginas archivadas por fase** (`/2027/preliminares/`, enlazadas desde el pie).
  Según el análisis de SEO, son **imprescindibles antes de pasar a cuartos (21–24 de
  enero)**: si no, al cambiar de fase desaparece el contenido de preliminares y
  sus posiciones en Google. Es también el requisito «abrir las fases celebradas
  desde el pie» de AGENTS.md.
- **URL por sesión** (`/2027/preliminares/8-enero/`) con un `Event` cada una; la
  app arranca en ese día y sincroniza la URL, y la portada deja de llevar los
  `Event`. Es lo que haría elegibles los resultados enriquecidos de eventos.
  Idealmente antes del 8 de enero.
- **Search Console** (manual): propiedad de dominio por DNS, enviar `sitemap.xml`
  e inspeccionar la URL de la portada.
- **Imagen de compartir por fase**: `og-image.jpg` nombra la fase y hay que
  rehacerla al cambiar (ver AGENTS.md, `public/`).
- **Web sin conexión (PWA)** para consultar el orden sin cobertura en el teatro.

## Deuda técnica conocida

- **Tests visuales** (`tests/visual/`): están escritos para la app anterior y no
  protegen la app actual. Hay que rehacerlos (fase R0 de
  [PLAN-REFACTOR.md](PLAN-REFACTOR.md)).
- **Esc en el modal de imprimir** tarda ~208 ms con CPU ×4: es el recálculo de
  estilos al cerrar el `<dialog>` (`:root:has(dialog:modal)`). No hay solución
  limpia sin tocar el modal.
- **CSS de la app anterior** en `global.css` y `coac-tokens.css`:
  `coac-scrollbar--on-header`, `coac-live-ring` y `--coac-topbar-height` (este
  último afecta a las anclas en móvil: quitarlo solo con prueba).
- **`luz-check` sobre `src/app` y `src/dialogs`**: 34 avisos (sobre todo las hojas
  de imprimir, que usan blanco fijo a propósito). `lint:luz` aún no revisa esas
  carpetas.

## Probado y descartado (no repetir)

- **Hidratar** (`hydrateRoot`) el HTML prerenderizado: `<luz-theme-mode>` y el
  estado guardado en el navegador obligan a repintar. Se sustituye con
  `createRoot`.
- **`content-visibility`** en las sesiones: la altura estimada descuadra el scroll
  y las anclas.
- **Cambiar el formato de los JSON** de fase: obligaría a cambiar el proceso de
  copiar el listado oficial a cambio de poco. Las mejoras van en código
  (`loadSessions.ts`, `validate.ts`, el schema).
- **Fundido del HTML prerenderizado a la app**: pone en riesgo el LCP.
- **Animaciones descartadas**, por accesibilidad o rendimiento:
  - barra del turno continua (fotogramas durante horas y movimiento sin pausa);
  - entrada de tarjetas y contador que rueda al escribir (movimiento en cada tecla);
  - segundos que ruedan (movimiento cada segundo en la tarjeta más visible);
  - cifras desde 00 al cargar (enseñan un dato falso);
  - tarjetas ligadas al scroll (`animation-timeline: view()`), parallax y confeti;
  - cabecera y filtro como una pieza rígida con `translate` (el filtro salta);
  - scroll suave al saltar, y animar alturas (`interpolate-size`,
    `grid-template-rows`: layout en cada fotograma y CLS);
  - fundido como sustituto con «reducir movimiento» (fotogramas con poco
    contraste: mejor el cambio instantáneo).
