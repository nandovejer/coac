import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "../components/ui/icons";
import "./DayCarousel.css";

/**
 * Fila de días deslizable: en móvil se pasa con el dedo (con encaje en cada
 * día) y a los lados van las flechas «anterior» y «siguiente». Las flechas se
 * apagan al llegar a un extremo y no salen si todo cabe (en escritorio la
 * fila es una rejilla y no hay nada que desplazar).
 */
export function DayCarousel({ children }: { children: ReactNode }) {
  const listId = useId();
  const listRef = useRef<HTMLOListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const max = list.scrollWidth - list.clientWidth;
    setEdges({ start: list.scrollLeft <= 1, end: list.scrollLeft >= max - 1 });
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    update();
    list.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => {
      list.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [update]);

  const scrollBy = (direction: 1 | -1) => {
    const list = listRef.current;
    if (!list) return;
    // Casi una pantalla de días, para que el último visible siga a la vista.
    // La suavidad la pone el CSS (y se quita con «reducir movimiento»).
    list.scrollBy({ left: direction * list.clientWidth * 0.8 });
  };

  const scrollable = !(edges.start && edges.end);

  return (
    <div className="coac-carousel" data-scrollable={scrollable || undefined}>
      <button
        type="button"
        className="coac-carousel__arrow"
        aria-controls={listId}
        disabled={edges.start}
        onClick={() => scrollBy(-1)}
      >
        <ChevronLeftIcon />
        <span className="coac-sr-only">Sesiones anteriores</span>
      </button>
      <ol id={listId} ref={listRef} className="coac-vc__days coac-carousel__list">
        {children}
      </ol>
      <button
        type="button"
        className="coac-carousel__arrow"
        aria-controls={listId}
        disabled={edges.end}
        onClick={() => scrollBy(1)}
      >
        <ChevronRightIcon />
        <span className="coac-sr-only">Sesiones siguientes</span>
      </button>
    </div>
  );
}
