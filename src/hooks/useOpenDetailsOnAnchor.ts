import { useEffect } from "react";

/** Despliega el `<details>` que es (o contiene) el elemento con ese id. */
export function openDetailsFor(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const details = target instanceof HTMLDetailsElement ? target : target.closest("details");
  if (details) details.open = true;
}

const idFromHash = (hash: string) => decodeURIComponent(hash.slice(1));

/**
 * Las sesiones van plegadas en `<details>`: un enlace a una sesión o a una
 * agrupación (buscador, índice, menú inferior) tiene que desplegarla antes de
 * que el navegador haga scroll, o no encontraría dónde ir.
 */
export function useOpenDetailsOnAnchor() {
  useEffect(() => {
    // En captura: se abre antes de que el navegador navegue al ancla.
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
      if (link?.hash) openDetailsFor(idFromHash(link.hash));
    };
    const onHashChange = () => openDetailsFor(idFromHash(location.hash));

    document.addEventListener("click", onClick, true);
    window.addEventListener("hashchange", onHashChange);
    if (location.hash) {
      openDetailsFor(idFromHash(location.hash));
      document.getElementById(idFromHash(location.hash))?.scrollIntoView();
    }
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);
}
