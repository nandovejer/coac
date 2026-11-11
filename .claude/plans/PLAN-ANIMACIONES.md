# Plan de animaciones · Rediseño E

Plan acordado entre una diseñadora de movimiento y una especialista en accesibilidad, tras un
debate en cuatro rondas (11/11/2026). Se aplica a la app publicada: `src/variants/VariantE.tsx` +
`VariantE.css` y los modales compartidos (`info/`, `print/`, `privacy/`). Implementado el
11/11/2026 (ver «Estado» más abajo).

## Estado (11/11/2026)

Implementados los seis arreglos previos, las tres tandas y las pruebas
(`pnpm run test:motion`, 46 pruebas en móvil y escritorio, `tests/motion/`). Código en
`src/variants/motion.ts`, `Countdown.tsx`, `useReached.ts`, `useGhostMark.ts`,
`dialog-motion.css` y los bloques «Movimiento» de `VariantE.css` y `coac-tokens.css`.

Desviaciones respecto a lo acordado, y por qué:

- **A10, fondo de botones**: no se anima `background-color`. La prueba de contraste a mitad
  de animación midió 2,48:1 en «Ver el directo»: el fondo pasaba por un azul claro con el
  texto ya blanco. Solo se animan borde y sombra. Tampoco está el tope de la flecha al
  desactivarse.
- **A1, solape**: la lista vieja sale en 128 ms y la nueva entra con 96 ms de retraso y 224
  ms (total 320), en vez de 180 y 320 solapadas. Con el solape, a media animación se
  superponían dos textos. Los recortes de `clip-path` llevan sus dos extremos explícitos
  (no se interpola desde `none`). Dentro de la transición el scroll es instantáneo: Luz pone
  `scroll-behavior: smooth` en `<html>` y dejaba la captura congelada.
- **A6**: las filas que viajan se nombran en el `<li>` de cada franja horaria (hora y
  tarjeta juntas), solo las que se ven bajo el filtro. Las que llegan esperan 80 ms a que se
  recojan las que se van. **No está el contador que rueda** del recuento.
- **A5**: la barra del turno va por pasos y el relevo anima la tarjeta y su segmento con un
  muelle; **no se dibuja el marco rojo en dos tramos**.
- **A7**: «reabrir cancela la salida» no está: si se vuelve a pulsar el botón durante los
  240 ms de salida, el modal se cierra y hay que pulsarlo otra vez.
- **A15**: solo el muelle de los accesos; sin el chevron de la tira ni el fondo.
- **`WAAPI` y `var()`**: la Web Animations API no acepta `var(--token)` como curva; `animateOnce`
  lee el valor del token. Una animación que falla nunca tumba la página (`try/catch`).

Sin hacer todavía, de las comprobaciones del plan: Lighthouse móvil (LCP, CLS, TBT), la
prueba 9 (INP con CPU ×4), la 11 (zoom 200 % y colores forzados) y las pruebas en
VoiceOver, TalkBack y un Android de gama baja.

## Cómo se llegó aquí

1. **Propuesta** (diseño): 16 ideas (A1–A16) con la metáfora del teatro: telón al cambiar de
   lista, foco que aterriza, cuenta atrás como marcador, luces de sala al cambiar de modo.
2. **Revisión** (accesibilidad): veredicto por idea. Rechazó las tarjetas animadas al hacer scroll
   (mareo) y partes de otras: los segundos que ruedan, la barra continua del turno, la animación al
   escribir y las cifras desde 00. Exigió que todo movimiento fuera opt-in y destapó fallos que hay
   hoy sin animación (foco invisible en el título de sesión, foco perdido tras «Lo entiendo», la
   cuenta atrás que vuelve a pintar toda la app cada segundo).
3. **Réplica** (diseño): aceptó casi todo, matizó la técnica (ficha fantasma en anillo para los
   chips, VT nombrando solo la primera sesión), renunció a cinco ideas y añadió N1–N3 (un anuncio
   al empezar el directo, sombra de despegue en las cabeceras pegajosas, `animateOnce()`).
4. **Cierre** (accesibilidad): comprobó las afirmaciones en el código y añadió tres hallazgos: el
   fundido por defecto de las View Transitions (con `plus-lighter`), «La fase ha terminado» durante
   hasta 30 s al empezar cada sesión, y el foco perdido tras «Ver todo el programa». No queda
   ningún desacuerdo abierto.

## Objetivo y principios

Que la app se entienda mejor al tocarla (qué ha cambiado, hacia dónde, dónde estoy) sin perder
velocidad en móvil ni accesibilidad. La metáfora es el teatro: *telón*, *foco*, *marcador* y *luces
de sala*.

1. **El texto nunca pasa por opacidad intermedia ni por una transición de `color`.** Lo que entra o
   sale lo hace con recorte (`clip-path`) y desplazamiento. Solo se funde lo que no tiene texto (el
   `::backdrop`).
2. **Nada anima el layout.** Solo `transform`/`translate`/`scale`, `clip-path`, colores y sombras.
   CLS sin cambios.
3. **Contenido, foco y regiones vivas listos desde el primer fotograma.** Nada retrasa el LCP,
   el foco ni un anuncio. Nada se anima si la URL trae ancla.
4. **El movimiento es opt-in** (`prefers-reduced-motion: no-preference`). Por defecto, mesura: lo
   que dispara un toque dura ≤ 320 ms y se desplaza ≤ 24 px (salvo la hoja modal).
5. Sin librerías: CSS, Web Animations API y View Transitions nativas como mejora progresiva. Sin
   soporte, todo queda exactamente como hoy.

## Tokens de movimiento

En `src/styles/coac-tokens.css`, bajo `:root`, para que lleguen también a los modales:

```css
:root {
  --coac-dur-instant: 90ms;   /* :active */
  --coac-dur-quick: 160ms;    /* color, sombra, hover */
  --coac-dur-base: 240ms;     /* cambio de estado de un componente */
  --coac-dur-gentle: 320ms;   /* cambio de lista, modal, aterrizaje: tope de lo que dispara un toque */
  --coac-dur-stage: 520ms;    /* solo paso a directo, luces de sala, entrada */
  --coac-stagger: 30ms;       /* como mucho 6 elementos */

  --coac-shift-xs: 2px;
  --coac-shift-sm: 8px;
  --coac-shift-md: 24px;      /* tope de desplazamiento salvo la hoja modal */

  --coac-ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);     /* entrar */
  --coac-ease-in: cubic-bezier(0.4, 0, 1, 1);          /* salir */
  --coac-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* mover lo que ya está */
  --coac-ease-press: cubic-bezier(0.3, 0, 0.5, 1);     /* hundirse al pulsar */
  /* Muelle (≈5 % de rebote): SOLO en `scale` o en recorridos ≤ 48 px */
  --coac-ease-spring: linear(0, 0.36 9%, 0.71 18%, 0.96 28%, 1.05 38%, 1.03 48%, 1 62%, 0.996 76%, 1);
}
@supports not (transition-timing-function: linear(0, 1)) {
  :root { --coac-ease-spring: var(--coac-ease-out); }
}
/* Segunda red: el mecanismo principal es el opt-in */
@media (prefers-reduced-motion: reduce) {
  :root {
    --coac-shift-xs: 0px; --coac-shift-sm: 0px; --coac-shift-md: 0px;
    --coac-dur-gentle: 0ms; --coac-dur-stage: 0ms; --coac-stagger: 0ms;
  }
}
```

Reglas de uso: entrar con `ease-out`; salir con `ease-in` y en `calc(<entrada> * 0.75)`; mover con
`ease-in-out`. Ninguna duración fuera de la escala.

## Política de `prefers-reduced-motion`

- **Opt-in**: toda `animation`, y toda `transition` sobre `transform`, `translate`, `scale`,
  `rotate`, `clip-path`, `outline-offset` o posición, se escribe dentro de
  `@media (prefers-reduced-motion: no-preference)`. Las reglas `reduce` de hoy
  (`VariantE.css` l. 1857–1870: cabecera, filtro y puntos quietos; tira de días sin
  `scroll-behavior: smooth`) se conservan.
- **Con `reduce` solo quedan** las transiciones de `background-color`, `border-color` y
  `box-shadow` ≤ 160 ms, el `::backdrop` ≤ 200 ms y el paso de la tarjeta de estado a tinta en
  160 ms. Ninguna View Transition, ningún desplazamiento, escala ni recorte animado. El desplazamiento
  **no se sustituye por un fundido**: el cambio es instantáneo.
- **JS**: `src/variants/motion.ts` es el único sitio que llama a `startViewTransition` o a
  `element.animate`. Lee `matchMedia("(prefers-reduced-motion: reduce)").matches` en el momento de
  la llamada.
- **Ningún estado depende de `animationend`/`transitionend`**: la limpieza se hace con
  `animation.finished`, `blur` o `setTimeout(duración + 50)`.

## `src/variants/motion.ts` (base, tanda 1)

- `prefersReducedMotion(): boolean`.
- `withViewTransition(update, types)`: si no hay soporte o hay `reduce`, ejecuta `update()` y
  termina. Si no, pone `data-vt` en `.coac-ve` y lanza
  `startViewTransition({ update: () => flushSync(update), types })` (con `try/catch` para Safari
  18.0–18.1, que no admite tipos). Quita `data-vt` en `finished` y en caso de error. Un segundo
  toque llama a `skipTransition()` y aplica el nuevo estado; nunca se encola. No lanza VT si la
  acción viene de un ancla (`hashchange` o carga con `location.hash`).
- `animateOnce(el, keyframes, options)`: devuelve `null` con `reduce`, con la pestaña oculta o si
  `el` no corta la ventana (una sola lectura de `getBoundingClientRect`). Pone `will-change` y lo
  quita en `finished`. Los llamadores usan `anim?.finished ?? Promise.resolve()`.

Regla base de VT (en `VariantE.css`, tanda 1). Evita el fundido por defecto del navegador y la
suma de colores (`plus-lighter`) en los solapes:

```css
::view-transition-old(*), ::view-transition-new(*) { mix-blend-mode: normal; }
::view-transition-old(root), ::view-transition-new(root) { animation: none; }
html:not(:active-view-transition-type(ve-theme))::view-transition-old(root) { display: none; }
```

## Arreglos previos (sin animación, tanda 1)

| Id | Arreglo | Archivos | Criterio de aceptación |
|---|---|---|---|
| P1 | **Cuenta atrás aislada.** `useRemaining` sale de `VariantE` a un componente `Countdown` (con su `.css`). Hoy toda la app se vuelve a renderizar cada segundo | `src/variants/Countdown.tsx`, `Countdown.css`, `VariantE.tsx` | Con la cuenta atrás en marcha, un `MutationObserver` en `.coac-ve__sessions` registra 0 mutaciones en 5 s |
| P2 | **Estado `starting`.** Hoy, durante hasta 30 s tras la hora de inicio, la tarjeta dice «La fase ha terminado» (`remaining` es `null` antes de que `useNow` traiga `p.live`). Si hay `upcoming` y no hay `remaining`: «Empieza la sesión» | `VariantE.tsx` (o `Countdown.tsx`), `VariantE.css` (`[data-state="starting"]`, mismos colores que `countdown`) | Con `page.clock` en inicio −2 s y avanzando 40 s, «La fase ha terminado» no aparece nunca |
| P3 | **Región viva única.** `<p className="coac-sr-only" role="status">` siempre montada en `VariantE`. Recibe el recuento de la búsqueda (500 ms después de la última tecla), «Sesión elegida: …» y N1. `.coac-ve__context` pierde `role="status"` y el botón queda fuera de la región | `VariantE.tsx` | Al escribir «mar» letra a letra, el texto de la región cambia una vez. La región existe en modo «focus». No contiene botones |
| P4 | **Foco tras «Ver todo el programa».** `.coac-ve__reset` se desmonta con el foco dentro. Pasa a hacer `p.reset()` y `afterPaint(scrollToProgramme)`, que da el foco al primer `.coac-ve__session-title` | `VariantE.tsx` | Tras pulsarlo con el teclado, `document.activeElement` es un `.coac-ve__session-title` |
| P5 | **Aviso de privacidad: montaje retrasado y foco.** `setVisible(true)` dentro de un `setTimeout(…, 600)`. «Lo entiendo», si el foco estaba en el aviso, lo pasa a `#siteMain` (`tabIndex={-1}`, `preventScroll: true`, `#siteMain:focus { outline: none }`) | `privacy/PrivacyNotice.tsx`, `VariantE.tsx`, `VariantE.css` | Durante los primeros 600 ms el aviso no está en el DOM. Tras «Lo entiendo» con el teclado, el foco no está en `<body>` |
| P6 | **Nada tapa el foco (2.4.11).** `useStickyHeights` publica también `--ve-top-h` y `--ve-filters-h` en `document.documentElement`. En `VariantE.css`: `html:has(.coac-ve) { scroll-padding-block-start: calc(var(--ve-top-h, 0px) + var(--ve-filters-h, 0px) + 16px); scroll-padding-block-end: var(--coac-privacy-notice-h, 0px); }`, que sustituye en E la regla de la `TopBar` de `src/styles/global.css` (l. 122–126) | `VariantE.tsx`, `VariantE.css` | Prueba 6: al tabular toda la página, ningún elemento enfocado queda entero bajo la cabecera, el filtro o el aviso. Si en escritorio lo tapa la cabecera destacada pegajosa, `scroll-margin-block-start` en sus tarjetas |

## Tanda 1 · Imprescindible

### A2 · El foco que aterriza
- **Pieza**: `.coac-ve__card` (tras `scrollToGroup` en `useShell.ts`) y `.coac-ve__session-title`
  (tras `scrollToProgramme`).
- **Movimiento**: `scrollToGroup` pone `data-landed` en la tarjeta. Con `no-preference`, en
  `.coac-ve__card[data-landed]:focus` se anima `outline-offset` de 8 px a 2 px en
  `--coac-dur-gentle` con `--coac-ease-out`. El `outline: 3px solid var(--ve-focus)` es pleno
  desde el fotograma 0. En el `h2`, un `::after` de 3 px bajo el título con `scale: 0 1 → 1 1`
  (`transform-origin: left`) en `--coac-dur-gentle`; **la raya es el indicador de foco del título**
  y se queda mientras tenga `:focus`. Sustituye al `outline: none` de la l. 329. Color:
  `--ve-focus` y, en cabeceras destacadas, `currentColor`.
- **Archivos**: `VariantE.css`, `useShell.ts`.
- **Accesibilidad**: `data-landed` se quita en `blur` o con `setTimeout`, nunca en
  `animationend`. Solo en aterrizajes programáticos. Con `reduce`, anillo y raya aparecen ya
  completos.
- **Aceptación**: pausada en `currentTime = 0`, `outline-width` es 3px y `outline-color` es
  `--ve-focus`. Con el `h2` enfocado, la raya se ve (contraste ≥ 3:1 en los tres modos, axe y
  `coac-tokens.test.ts`). Tras `blur`, la tarjeta no conserva `data-landed`.

### A10 · Pulsaciones
- **Pieza**: `.coac-ve__action`, `.coac-ve__chip`, `.coac-ve__day`, `.coac-ve__arrow`,
  `.coac-ve__pill-button`, `.coac-ve__print-button`, `.coac-ve__reset`, `.coac-ve__clear`.
- **Movimiento** (en `no-preference`): `:active { scale: 0.96 }` (días y chips 0.94) en
  `--coac-dur-instant` con `--coac-ease-press`. Al soltar, `--coac-ease-spring` en
  `--coac-dur-base`. Hover solo con `@media (hover: hover) and (pointer: fine)`: los accesos suben
  1 px y pasan a `--ve-shadow-raised`; los chevrons avanzan `--coac-shift-xs`; la ✕ gira 90°.
  `background-color`, `border-color` y `box-shadow` en `--coac-dur-quick` (también con `reduce`).
  Tope de la flecha (`scale: 0.94 → 1`) solo cuando `disabled` se activa **por un clic en la
  flecha**.
- **Archivos**: `VariantE.css` (y `DayStrip` en `VariantE.tsx` para el tope).
- **Accesibilidad**: el anillo `:focus-visible` aparece al instante (sin transición de `outline` ni
  de `outline-offset`). El color del texto, sin transición. Las tarjetas no llevan hover.
- **Aceptación**: con `reduce`, `getAnimations()` tras pulsar solo contiene transiciones de color
  o sombra. El contraste no cambia (las capturas en reposo no varían).

### A4 · El marcador y el paso a directo (+ N1)
- **Pieza**: cifras de `Countdown` (antes `.coac-ve__digits`) y `.coac-ve__status[data-state]`.
- **Movimiento**:
  - Cada cifra de días, horas y minutos va en una ventana `overflow: clip; block-size: 1lh`: la que
    sale sube `translateY(-100%)` y la nueva entra desde `translateY(100%)`, en 420 ms con
    `--coac-ease-spring` (recorrido ≤ 48 px), sin opacidad. **Los segundos cambian sin
    animación.**
  - Paso a directo (`countdown|starting → live`): `background-color` de la tarjeta en
    `--coac-dur-stage` con `--coac-ease-in-out` (160 ms con `reduce`). Con `animateOnce`:
    la pastilla `.coac-ve__on-air` hace `scale: 0.85 → 1` (muelle, 320 ms) y
    `.coac-ve__status-title` entra con `clip-path: inset(100% 0 0 0) → inset(0)` y 8 px de
    desplazamiento, 60 ms después.
  - **N1**: la región de P3 recibe «Empieza la sesión. Actúa {autor}.» una vez por fecha de
    sesión, en el paso a `live` y nunca en el primer render. Sí se anuncia al volver a la pestaña.
    Se vacía a los 5 s. No se anuncian los relevos.
- **Archivos**: `Countdown.tsx`, `Countdown.css`, `VariantE.tsx`, `VariantE.css`.
- **Accesibilidad**: las cifras siguen `aria-hidden`. El texto `coac-sr-only` «Faltan…» no es
  región viva. Texto blanco sobre cobalto y sobre tinta en los dos extremos.
- **Aceptación**: en 10 s de cuenta atrás no hay ninguna animación sobre la cifra de los segundos.
  Prueba 4: con la transición de fondo pausada al 25, 50 y 75 %, axe `color-contrast` pasa en los
  tres modos. Con `page.clock` cruzando la hora de inicio, la región dice el texto de N1 una vez;
  al recargar ya en directo, no dice nada.

### A1 · El telón (cambio de lista)
- **Pieza**: `.coac-ve__sessions`, disparado por `.coac-ve__day`, `.coac-ve__reset`, `goToToday`
  (accesos «Sesión de hoy» y `.coac-ve__status-brief-link`).
- **Movimiento**: `withViewTransition(() => { …estado…; showChosenDay() | scrollToProgramme() },
  [tipo])`. El scroll va dentro del `update`, tras el `flushSync`. Nombres solo con `data-vt`:
  `.coac-ve[data-vt] .coac-ve__sessions > .coac-ve__session:first-child { view-transition-name:
  ve-list }` y `.coac-ve[data-vt] .coac-ve__filters { view-transition-name: ve-filters }`. En
  `ve-filters`: grupo y `new` sin animación, `old` con `display: none`. `ve-list`: grupo sin
  animación. La imagen vieja sale en 180 ms con `--coac-ease-in`: `clip-path: inset(0) →
  inset(0 0 0 100%)` y `translate: calc(var(--coac-shift-md) * -1) 0`. La nueva entra en
  `--coac-dur-gentle` con `--coac-ease-out`: `clip-path: inset(0 100% 0 0) → inset(0)` y
  `translate: var(--coac-shift-md) 0 → 0`. Las dos se solapan, no se encadenan. Tipos: `ve-forward`
  (día posterior), `ve-back` (anterior; espejo) y `ve-reset` (vertical, `inset(0 0 100% 0) →
  inset(0)`), elegidos con `html:active-view-transition-type(…)`.
- **Archivos**: `motion.ts`, `VariantE.tsx`, `VariantE.css`.
- **Accesibilidad**: el foco se queda en el día pulsado. En «Sesión de hoy» y «Ver todo» va al
  `h2` (A2). El scroll final es el mismo con y sin VT. No hay VT con `reduce` ni por ancla.
- **Aceptación**: prueba 3 (paridad: mismo `activeElement`, `scrollY` ±1 px). Prueba 12 (ningún
  pseudo funde ni usa `plus-lighter`). Capturas en reposo idénticas (sin `data-vt`, nada nombrado).
  Prueba 9: INP del clic en un día ≤ +16 ms de mediana frente a `main`, con CPU ×4.

### A7 · Modales en hoja
- **Pieza**: `.coac-info` (Quiénes somos, Privacidad) y `.coac-print-dialog`.
- **Movimiento** (en `no-preference`): entrada con `@starting-style`. En móvil, `translate: 0 100%
  → 0` en `--coac-dur-gentle` con `--coac-ease-out`; en escritorio, 24 px y `scale: 0.98 → 1`.
  `::backdrop`: `background-color` de transparente a `rgb(0 0 0 / 0.6)`. Salida en
  `calc(var(--coac-dur-gentle) * 0.75)` con `--coac-ease-in`, **solo bajo `@supports (overlay:
  auto)`** (`transition-behavior: allow-discrete` en `overlay` y `display`); sin `overlay`, la
  salida es instantánea.
- **Archivos**: `info/InfoDialog.tsx`, `info/InfoDialog.css`, `print/PrintSchedule.tsx`,
  `print/PrintSchedule.css`.
- **Accesibilidad**: en el listener de `close`, poner `inert` en el `<dialog>` y en su panel,
  esperar a `Promise.allSettled(dialog.getAnimations().map(a => a.finished))` y luego `onClose`.
  El foco vuelve al botón que lo abrió en el mismo `close()`. Reabrir cancela la salida. Con
  `reduce`, solo el `::backdrop` (≤ 200 ms).
- **Aceptación**: prueba 5. Justo después de `close()`, `activeElement` es el botón que lo abrió y
  el `<dialog>` tiene `inert`. Un toque durante la salida no llega al contenido del diálogo.

## Tanda 2

### A3 · Ficha fantasma (días y chips)
- **Pieza**: `.coac-ve__days`, `.coac-ve__chips`.
- **Movimiento**: el estilo de `aria-pressed` se aplica al instante en el botón, como hoy. Un
  elemento `aria-hidden` y desechable viaja del botón anterior al nuevo (FLIP con WAAPI sobre
  `transform`, `--coac-dur-base`) y se retira al llegar. Muelle si el recorrido es ≤ 48 px; si no,
  `--coac-ease-in-out`. En **días**, relleno con el fondo y la sombra del elegido, por debajo del
  texto. En **chips**, **anillo** de 2 px en `--ve-second`, sin relleno, por encima del contorno;
  en alto contraste, negro y de 3 px.
- **Archivos**: `VariantE.tsx` (hook `useGhostMark`, o en `src/variants/useGhostMark.ts`),
  `VariantE.css`.
- **Accesibilidad**: sin animación si el destino está en otra fila (`offsetTop` distinto: zoom,
  reflujo, 1.4.12). Con `@media (forced-colors: active)`, sin fantasma y con borde visible en el
  pulsado. Con `reduce` o sin JS, el estilo de hoy.
- **Aceptación**: a 320 px de ancho con zoom al 200 % y con `forcedColors: "active"`, el pulsado se
  distingue (prueba 11). Prueba 4 en chips: ningún fotograma de texto con contraste < 4.5:1.

### A8 · Luces de sala (modo de color)
- **Pieza**: `<luz-theme-mode>` en `.coac-ve__footer-theme`.
- **Movimiento**: un listener `click` en fase de captura sobre `.coac-ve__footer-theme`, solo si
  el destino es `.luz-theme-mode__button`. Calcula el siguiente modo con los radios no
  deshabilitados en orden del DOM, llama a `stopImmediatePropagation()` y luego a
  `withViewTransition(() => { el.choice = next }, ["ve-theme"])`. Usa la API pública de Luz: el
  setter `choice` es síncrono y emite `luz-theme-mode:change`. Guarda el centro del botón en
  `--vt-x/--vt-y`. `::view-transition-new(root)` anima `clip-path: circle(0 at var(--vt-x)
  var(--vt-y)) → circle(150vmax at …)` en `--coac-dur-stage` con `--coac-ease-in-out`; la imagen
  vieja queda debajo, sin animación y con `mix-blend-mode: normal`.
- **Archivos**: `VariantE.tsx` (o `ThemeModeSwitch.tsx` si se quiere en un solo sitio),
  `VariantE.css`.
- **Accesibilidad**: el foco se queda en `.luz-theme-mode__button`. El `role="status"` de Luz
  sigue anunciando «Modo de color: …». Sin soporte o con `reduce`, cambio instantáneo.
- **Aceptación**: prueba de dependencia de Luz: el modo resultante coincide con el del clic nativo
  sin VT y se emite `luz-theme-mode:change`. El texto del `status` de Luz cambia. Prueba 12: ningún
  fotograma con `plus-lighter`.

### A6 · Filtro de modalidad con View Transition y contador
- **Pieza**: `.coac-ve__card` al pulsar un `.coac-ve__chip` (`ModalidadFilter` en `parts.tsx`).
  El recuento de `.coac-ve__context`.
- **Movimiento**: `withViewTransition(() => p.setModalidad(m), ["ve-filter"])`. Antes, las tarjetas
  que cortan la ventana (como mucho 12) reciben `view-transition-name: ve-c-<id>` y
  `view-transition-class: ve-card`. Se quitan en `finished`, en `skipTransition` y en caso de
  error. Las que siguen interpolan su posición (`--coac-dur-base`, `--coac-ease-in-out`). Las que
  se van: `scale: 1 → 0.96` y recorte, `--coac-dur-quick`, `--coac-ease-in`. Las que llegan:
  `--coac-shift-sm` y recorte, `--coac-dur-base`. Total ≤ 320 ms. **Al escribir, nada se anima.**
  El contador rueda (como A4) solo cuando cambia por un chip.
- **Archivos**: `VariantE.tsx`, `VariantE.css`.
- **Accesibilidad**: el foco se queda en el chip. Las cifras que ruedan son `aria-hidden` y llevan
  al lado una copia `coac-sr-only`. El anuncio va por la región de P3.
- **Aceptación**: tras la VT no queda ningún `view-transition-name` en línea. Al escribir,
  `getAnimations()` está vacío (salvo los puntos de directo).

### A13 · Rótulo de contexto
- **Pieza**: `.coac-ve__context`, solo dentro de la VT de A1.
- **Movimiento**: `.coac-ve[data-vt] .coac-ve__context { view-transition-name: ve-context }`. Si
  solo existe en el estado nuevo, baja desde detrás del filtro (`translate: 0 -100% → 0`,
  recortado por su caja, `--coac-dur-base`, `--coac-ease-out`). Al desaparecer, sube en
  `--coac-dur-quick`.
- **Archivos**: `VariantE.css`.
- **Aceptación**: la región viva de P3 no se monta ni se desmonta con el rótulo. Sin VT, el rótulo
  cambia en seco.

### A5 · El relevo del directo
- **Pieza**: `.coac-ve__progress`, `.coac-ve__card[data-stage="live"]`, `.coac-ve__segment`.
- **Movimiento**:
  - Barra **por pasos**: `.coac-ve__progress::after { inline-size: 100%; clip-path: inset(0
    calc((1 - var(--ve-progress, 0)) * 100%) 0 0 round var(--ve-radius)); }`. Con
    `no-preference`, `transition: clip-path 600ms linear`. Avanza en cada tick de `useNow` (30 s)
    y está quieta el resto del tiempo.
  - Relevo (cambia `p.live.group.id`, nunca en el primer render), con `animateOnce`: el
    `.coac-ve__card::after` (libre hoy) dibuja el marco rojo de 2 px con `clip-path` en dos tramos,
    en `--coac-dur-stage` con `--coac-ease-in-out`. El segmento que pasa a `done` se rellena
    (`scaleX: 0 → 1`, `--coac-dur-gentle`) y el siguiente crece (`scale: 1 0.57 → 1 1`, muelle).
- **Archivos**: `VariantE.tsx`, `VariantE.css`.
- **Accesibilidad**: el marco y «Actuando ahora» están en el DOM desde el primer fotograma. Nada
  se anima al volver a la pestaña ni si se han saltado relevos. Con `reduce`, todo en seco.
- **Aceptación**: prueba 8. En directo, con la página quieta 10 s, `getAnimations()` solo contiene
  los puntos `coac-ve-dot`.

### A9 · Cabecera y filtro (versión reducida)
- **Pieza**: `.coac-ve__top` (`data-header-hidden`), `.coac-ve__filters` (`data-stuck`).
- **Movimiento** (en `no-preference`): se esconden en `calc(var(--coac-dur-base) * 0.75)` con
  `--coac-ease-in` y vuelven en `--coac-dur-base` con `--coac-ease-out`. La cabecera usa
  `transform`; el filtro sigue usando `inset-block-start`, como hoy. Con `data-stuck`,
  `.coac-ve__filters::before` gana `box-shadow: var(--ve-shadow)` en `--coac-dur-quick`; en alto
  contraste, línea inferior de 2 px.
- **Archivos**: `VariantE.css`.
- **Accesibilidad**: se conserva la excepción `:focus-within` / `:has(.coac-ve__top:focus-within)`.
  Con `reduce`, en seco (como hoy).
- **Aceptación**: capturas con el filtro pegado y sin pegar en los tres modos. Con el foco en la
  cabecera, no se esconde al bajar.

### A14 · Salida del aviso de privacidad
- **Pieza**: `.coac-privacy-notice`.
- **Movimiento**: la entrada actual pasa a `--coac-dur-gentle` con `--coac-ease-out` (el retraso
  ya lo da P5). «Lo entiendo» la baja con WAAPI (`translateY(100%)`, `calc(var(--coac-dur-base) *
  0.75)`, `--coac-ease-in`) antes de desmontarla, con el botón `disabled` durante la salida.
- **Archivos**: `privacy/PrivacyNotice.tsx`, `privacy/PrivacyNotice.css`.
- **Aceptación**: el foco ya se ha movido (P5) antes de que empiece la salida. Con `reduce`,
  desaparece en seco.

## Tanda 3 · Si sobra tiempo

| Id | Pieza y movimiento | Condiciones | Aceptación |
|---|---|---|---|
| A11 | Primera carga: `.coac-ve__status-mark`, de `translate: 50% 40%` a `50% 12%` en `--coac-dur-stage` con `--coac-ease-out`; los segmentos de hoy se rellenan con `--coac-stagger` de 20 ms (tope 180 ms). Las cifras aparecen con su valor | Sin `location.hash`, con `scrollY === 0`, sin `pageshow.persisted`, una vez por pestaña (`sessionStorage` en try/catch). Nada con `reduce` | LCP de Lighthouse móvil igual antes y después |
| A4b | Telón de la fachada en la última hora: `--ve-curtain` (0–1) **por minuto**, sin transición, sube la marca un 12 % | Fija con `reduce`. `FallaLogo` ya es `aria-hidden` | Ninguna animación ni transición registrada sobre la marca |
| A15 | `.coac-ve__action[data-live]`: `background-color` en `--coac-dur-base` y `scale: 0.9 → 1` (muelle) una vez al aparecer `data-live`. El chevron de `.coac-ve__strip` avanza `--coac-shift-xs` una vez al aparecer la tira | Nunca en el primer render. Ningún bucle nuevo: solo los puntos `coac-ve-dot` | Prueba 8 |
| N2 | Escritorio: `.coac-ve__session[data-featured] .coac-ve__session-head` con `container-type: scroll-state`. Al engancharse, sombra en un pseudo-elemento propio, en `--coac-dur-quick` | Bajo `@supports (container-type: scroll-state)`. Línea de 2 px en alto contraste | Capturas a ≥ 64rem con la cabecera pegada y sin pegar |
| R1 | Quitar la opacidad de `coac-digit-in/out` en `src/components/ui/RollingNumber.css` (app anterior, solo en desarrollo) | — | Las cifras ruedan sin `opacity` |

## Descartado

- **Barra del turno continua (25 min)**: fotogramas de compositor durante horas (batería) y
  movimiento continuo sin pausa (2.2.2). La sustituye la barra por pasos de A5.
- **Entrada de tarjetas al escribir**: movimiento en cada tecla y beneficio nulo con el teclado
  abierto.
- **Contador que rueda al escribir**: el mismo motivo; solo rueda con los chips.
- **Segundos que ruedan**: movimiento cada segundo en la tarjeta más visible (2.2.2, TDAH).
- **Cifras desde 00 al cargar**: muestran un dato falso durante 420 ms.
- **Tarjetas ligadas al scroll (`animation-timeline: view()`)**: desencadenante vestibular, y el
  público mayor no conoce el ajuste del sistema.
- **Cabecera y filtro como pieza rígida con `translate`**: el filtro se solapa sin pegar y salta
  `--ve-top-h` px al marcarse `data-stuck`.
- **Telón con toda la lista en modo «focus»**: basta con nombrar la primera sesión.
- **Reenviar el clic a Luz y vigilar `data-mode`**: frágil. Luz tiene el setter `choice`.
- **Fundido del HTML del SEO a la app**: pone en riesgo el LCP.
- **Scroll suave al saltar**: recorrer la página animando marea; el telón y el foco dan la
  continuidad.
- **Animar alturas** (`interpolate-size`, `grid-template-rows`): layout por fotograma y CLS.
- **Parallax de la fachada y confeti**: movimiento sin función.
- **Fundido como sustituto con «reducir movimiento»**: crea los fotogramas de poco contraste que
  el proyecto evita; mejor el cambio instantáneo.

## Plan de pruebas

Playwright (Chromium) contra el build `e2e` con `tests/fixtures/`, **escritas para E** (las de
`tests/visual/` siguen siendo de la app anterior). El reloj simulado ya existe (`clock.spec.ts`,
`base.ts`).

| # | Prueba | Tanda |
|---|---|---|
| 1 | Dos proyectos: `reducedMotion: "reduce"` (capturas, con `animations: "disabled"`) y `"no-preference"` | 1 |
| 2 | Inventario con `reduce`: tras elegir día, chip, abrir y cerrar modal, cambiar de modo, aterrizar y cargar con ancla, las propiedades de `effect.getKeyframes()` de `document.getAnimations()` están solo en {`background-color`, `border-color`, `box-shadow`} (y el `::backdrop`), con `duration ≤ 200`. Un `addInitScript` cuenta **0** llamadas a `startViewTransition` | 1 |
| 3 | Paridad con y sin VT (`delete document.startViewTransition` en `addInitScript`): mismo `activeElement`, `scrollY` ±1 px y la sesión justo bajo el filtro | 1 |
| 4 | Contraste a mitad de animación: `a.pause(); a.currentTime = d * k` con k = 0,25/0,5/0,75 y axe `color-contrast` en claro, oscuro y alto contraste. Tanda 1: tarjeta de estado y A2. Tanda 2: chips (A3) | 1–2 |
| 5 | Foco al cerrar modales: en el mismo tick de `close()`, el foco está en el botón que lo abrió y el `<dialog>` tiene `inert` | 1 |
| 6 | Nada enfocable fuera de la vista ni tapado: tabular toda la página y comprobar que el rectángulo del enfocado corta la ventana y no queda entero bajo la cabecera, el filtro, la cabecera destacada o el aviso | 1 |
| 7 | Regiones vivas: un solo cambio al escribir «mar»; la región existe en modo «focus»; N1 una vez al cruzar la hora y ninguna al cargar en directo; el `status` de Luz cambia al cambiar de modo | 1 |
| 8 | En reposo: en directo y con la página quieta 10 s, `getAnimations()` solo contiene los puntos de directo. Ninguna animación con `duration > 1000` salvo ellos | 1 |
| 9 | INP y LoAF: con CDP `Emulation.setCPUThrottlingRate({ rate: 4 })`, `PerformanceObserver` de `event` (`durationThreshold: 16`) y `long-animation-frame` en el clic de día, chip y modo, 10 repeticiones. Mediana ≤ +16 ms frente a `main` y ningún LoAF nuevo > 50 ms | 2 (el de A1, ya en la 1) |
| 10 | Renders: 0 mutaciones en `.coac-ve__sessions` en 5 s de cuenta atrás (P1) | 1 |
| 11 | Zoom y modos forzados: 320 px de ancho con zoom al 200 % y `forcedColors: "active"`: días y chips pulsados distinguibles | 2 |
| 12 | VT limpias: durante cada VT, ningún `::view-transition-old/new` tiene animación de `opacity` no declarada ni `mix-blend-mode` distinto de `normal` | 1 |
| 13 | Hora de inicio: con `page.clock` de −2 s a +40 s, «La fase ha terminado» no aparece (P2) | 1 |

Fuera de Playwright, en cada tanda:

- `pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build`, `check:contrast`,
  `lint:luz`.
- **Lighthouse móvil (lento)**, tres pasadas antes y después: LCP igual, CLS 0, TBT sin subir.
- **VoiceOver (iOS) y TalkBack**: elegir día, chip, abrir y cerrar cada modal, cambiar de modo,
  «Lo entiendo», «Ver todo el programa» y el paso a directo. Mismo foco y mismos anuncios que se
  esperan.
- **Tanda 2**: Android de gama baja real para A1, A6 y A8 (sin tirones visibles), y una prueba
  informal de mareo con una o dos personas mayores o sensibles al movimiento durante 5 minutos. Lo
  que señalen se retira o reduce su distancia.
