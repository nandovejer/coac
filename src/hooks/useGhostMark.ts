import { useEffect } from "react";
import { animateOnce, prefersReducedMotion } from "../lib/motion";

/**
 * Ficha fantasma: cuando el botón pulsado (`aria-pressed="true"`) cambia, una
 * ficha desechable (`aria-hidden`, sin texto) viaja del anterior al nuevo. El
 * estado sigue en el botón, como siempre; la ficha solo acompaña. En los días es
 * la ficha con fondo y sombra del elegido, por debajo del texto; en las
 * modalidades, un anillo sin relleno por encima, para que el texto no cambie de
 * contraste a mitad de camino.
 *
 * No viaja con «reducir movimiento», con colores forzados, si el destino está
 * en otra fila (zoom o reflujo) o si no cabe entero en la tira.
 */
export function useGhostMark(
  hostSelector: string,
  scrollerSelector: string,
  buttonSelector: string,
  kind: "day" | "chip",
) {
  useEffect(() => {
    const host = document.querySelector<HTMLElement>(hostSelector);
    const scroller = document.querySelector<HTMLElement>(scrollerSelector);
    if (!host || !scroller) return;
    const pressedNow = () => host.querySelector<HTMLElement>(`${buttonSelector}[aria-pressed="true"]`);
    let pressed = pressedNow();
    let frame = 0;

    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      // Se mide tras pintar: la tira ya ha centrado el día nuevo
      frame = requestAnimationFrame(() => {
        const next = pressedNow();
        const previous = pressed;
        pressed = next;
        if (next && previous && previous !== next && previous.isConnected) glide(previous, next);
      });
    });
    observer.observe(host, { subtree: true, attributes: true, attributeFilter: ["aria-pressed"] });

    function glide(from: HTMLElement, to: HTMLElement) {
      if (prefersReducedMotion() || window.matchMedia("(forced-colors: active)").matches) return;
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const view = scroller!.getBoundingClientRect();
      const inside = (box: DOMRect) => box.left >= view.left - 1 && box.right <= view.right + 1;
      if (Math.abs(a.top - b.top) > 2 || !inside(a) || !inside(b)) return;

      const origin = host!.getBoundingClientRect();
      const ghost = document.createElement("span");
      ghost.className = "coac-ve__ghost";
      ghost.dataset.kind = kind;
      ghost.setAttribute("aria-hidden", "true");
      Object.assign(ghost.style, {
        left: `${b.left - origin.left + host!.scrollLeft}px`,
        top: `${b.top - origin.top + host!.scrollTop}px`,
        width: `${b.width}px`,
        height: `${b.height}px`,
      });
      host!.append(ghost);
      if (kind === "day") host!.setAttribute("data-ghosting", "");

      const finish = () => {
        ghost.remove();
        host!.removeAttribute("data-ghosting");
      };
      // Muelle en recorridos cortos (48 px o menos); si no, una curva sin rebote
      const short = Math.abs(a.left - b.left) <= 48;
      const animation = animateOnce(
        ghost,
        [
          { translate: `${a.left - b.left}px 0`, width: `${a.width}px` },
          { translate: "0 0", width: `${b.width}px` },
        ],
        {
          duration: 240,
          easing: short ? "var(--coac-ease-spring)" : "var(--coac-ease-in-out)",
        },
      );
      if (!animation) return finish();
      void animation.finished.then(finish, finish);
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [hostSelector, scrollerSelector, buttonSelector, kind]);
}
