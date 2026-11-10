import { useEffect, useState } from "react";

/**
 * `true` cuando el elemento con ese id ha quedado por encima de la pantalla
 * (se ha pasado al bajar). Usa IntersectionObserver: no escucha el scroll.
 */
export function useScrolledPast(id: string): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const target = document.getElementById(id);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      setPast(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [id]);

  return past;
}
