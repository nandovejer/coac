import { flushSync } from "react-dom";

/**
 * Único sitio que lanza View Transitions o animaciones desde JS (ver
 * .claude/plans/PLAN-ANIMACIONES.md). Todo es mejora progresiva: sin soporte,
 * con «reducir movimiento» o con una pestaña oculta, el cambio es instantáneo
 * y queda exactamente como sin animación.
 */

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

/** Se lee en el momento de usarla: el ajuste del sistema puede cambiar con la página abierta. */
export function prefersReducedMotion() {
  return typeof window.matchMedia === "function" && window.matchMedia(REDUCE_QUERY).matches;
}

type ViewTransitionLike = {
  finished: Promise<unknown>;
  skipTransition: () => void;
};

type StartViewTransition = (
  options: (() => void) | { update: () => void; types?: string[] },
) => ViewTransitionLike;

let current: ViewTransitionLike | null = null;

/**
 * `true` si `withViewTransition` animaría ahora el cambio. Si no (sin soporte, con
 * «reducir movimiento», con la pestaña oculta o con un ancla `#…` en la URL), el
 * cambio es el de siempre y quien llama puede aplicarlo como transición de React,
 * sin bloquear la respuesta a la pulsación.
 */
export function willAnimateChange() {
  return (
    "startViewTransition" in document &&
    !prefersReducedMotion() &&
    document.visibilityState !== "hidden" &&
    !window.location.hash
  );
}

/**
 * Aplica un cambio de estado de React dentro de una View Transition. `change`
 * se aplica síncrono (`flushSync`) para que el navegador capture el estado nuevo
 * a tiempo; `after` (el scroll que lo acompaña) corre justo después, ya con el
 * DOM nuevo y antes de la captura, así que el salto queda tras el telón. Un
 * segundo toque durante la transición la salta y aplica el cambio nuevo: nunca
 * se encola nada.
 *
 * Sin transición (con «reducir movimiento», sin soporte, con la pestaña oculta o
 * si la acción viene de un ancla `#…`), el cambio es el de siempre: `change` y,
 * tras pintar, `after`.
 */
export function withViewTransition({
  change,
  after,
  prepare,
  types = [],
}: {
  /** Solo con transición: corre antes de la captura vieja (p. ej. para marcar elementos). */
  prepare?: () => void;
  change: () => void;
  /** `true` si corre dentro de la transición: el scroll tiene que ser instantáneo, no suave. */
  after?: (viaTransition: boolean) => void;
  types?: string[];
}) {
  const doc = document as Document & { startViewTransition?: StartViewTransition };
  const root = document.querySelector<HTMLElement>(".coac-app");
  if (!root || !willAnimateChange()) {
    change();
    if (after) requestAnimationFrame(() => requestAnimationFrame(() => after(false)));
    return;
  }

  current?.skipTransition();
  // El primer tipo dice qué se nombra (coac-forward, coac-back, coac-reset, coac-filter, coac-theme)
  root.setAttribute("data-vt", types[0] ?? "");
  prepare?.();
  const apply = () => {
    flushSync(change);
    after?.(true);
  };
  let transition: ViewTransitionLike;
  try {
    // Con tipos (Chrome 125+, Safari 18.2+); Safari 18.0–18.1 no admite el objeto
    transition = doc.startViewTransition({ update: apply, types });
  } catch {
    transition = doc.startViewTransition(apply);
  }
  current = transition;
  const done = () => {
    if (current === transition) {
      current = null;
      root.removeAttribute("data-vt");
      document.querySelectorAll("[data-vt-card]").forEach((card) => card.removeAttribute("data-vt-card"));
    }
  };
  transition.finished.then(done, done);
}

/**
 * Anima `element` solo si merece la pena: nada con «reducir movimiento», con la
 * pestaña oculta o si el elemento no se ve en pantalla. Devuelve `null` cuando no
 * anima; quien llama usa `anim?.finished ?? Promise.resolve()`. Pone `will-change`
 * solo mientras dura.
 */
export function animateOnce(
  element: HTMLElement | null,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: KeyframeAnimationOptions,
) {
  if (!element || prefersReducedMotion() || document.visibilityState === "hidden") return null;
  const box = element.getBoundingClientRect();
  if (box.bottom < 0 || box.top > window.innerHeight) return null;
  const properties = Array.isArray(keyframes) ? Object.keys(keyframes[0] ?? {}) : Object.keys(keyframes);
  const clear = () => element.style.removeProperty("will-change");
  try {
    element.style.willChange = properties.join(", ");
    const animation = element.animate(keyframes, { ...options, easing: resolveEasing(options.easing) });
    animation.finished.then(clear, clear);
    return animation;
  } catch {
    // Una animación que falla nunca puede tumbar la página
    clear();
    return null;
  }
}

/** La Web Animations API no acepta `var(--token)` como curva: se lee el valor del token. */
function resolveEasing(easing: string | undefined) {
  const token = easing && /^var\((--[\w-]+)\)$/.exec(easing)?.[1];
  if (!token) return easing;
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim() || "ease";
}

/**
 * Al cerrarse un `<dialog>` (evento `close`), el foco ya ha vuelto a quien lo
 * abrió. Se pone `inert` para que nada llegue a su contenido mientras sale, y se
 * espera a que acabe su animación de salida (si la hay) antes de llamar a `done`,
 * que lo desmonta.
 */
export function afterDialogExit(dialog: HTMLDialogElement, done: () => void) {
  dialog.inert = true;
  const running = dialog.getAnimations({ subtree: true });
  void Promise.allSettled(running.map((animation) => animation.finished)).then(done);
}
