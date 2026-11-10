import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import "./ScrollRow.css";

/**
 * Fila que se desliza de lado: con el dedo (desplazamiento nativo del
 * navegador) o con las flechas de los extremos. Cada flecha solo aparece si hay
 * algo más que ver en esa dirección. Las flechas son una ayuda para el puntero:
 * con teclado o lector de pantalla se llega a cada elemento enfocándolo, y el
 * navegador lo desplaza a la vista, así que no entran en el orden de tabulación.
 */
export function ScrollRow({ children }: { children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ before: false, after: false });

  const update = useCallback(() => {
    const el = viewport.current;
    if (!el) return;
    const before = el.scrollLeft > 1;
    const after = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setMore((prev) => (prev.before === before && prev.after === after ? prev : { before, after }));
  }, []);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    // El contenido y el ancho cambian al girar la pantalla o al refrescarse la hora.
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [update]);

  const scrollBy = (direction: 1 | -1) => {
    const el = viewport.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.75, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div
      className="coac-scroll-row"
      data-more-before={more.before || undefined}
      data-more-after={more.after || undefined}
    >
      <button
        type="button"
        className="coac-scroll-row__arrow coac-scroll-row__arrow--before"
        onClick={() => scrollBy(-1)}
        tabIndex={-1}
        aria-hidden="true"
      >
        <ChevronLeftIcon />
      </button>
      <div ref={viewport} className="coac-scroll-row__viewport">
        {children}
      </div>
      <button
        type="button"
        className="coac-scroll-row__arrow coac-scroll-row__arrow--after"
        onClick={() => scrollBy(1)}
        tabIndex={-1}
        aria-hidden="true"
      >
        <ChevronRightIcon />
      </button>
    </div>
  );
}
