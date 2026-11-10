import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { PRIVACY_HASH } from "./policy";

const isPrivacyUrl = () => window.location.hash === PRIVACY_HASH;

/**
 * La privacidad es una «página» sin router: un modal que se abre con
 * `#privacidad`. Así tiene dirección propia (se puede enlazar y compartir) y
 * «Atrás» la cierra.
 */
export function usePrivacyRoute() {
  const [open, setOpen] = useState(isPrivacyUrl);

  // «Atrás», «Adelante» o un enlace normal a #privacidad
  useEffect(() => {
    const sync = () => setOpen(isPrivacyUrl());
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  // Al pulsar el enlace: se abre sin saltar de sitio y queda en el historial.
  const openPrivacy = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (!isPrivacyUrl()) window.history.pushState({ coacPrivacy: true }, "", PRIVACY_HASH);
    setOpen(true);
  }, []);

  // Al cerrar se quita el ancla: si la pusimos nosotros, volviendo atrás.
  const closePrivacy = useCallback(() => {
    setOpen(false);
    if (!isPrivacyUrl()) return;
    const state = window.history.state as { coacPrivacy?: boolean } | null;
    if (state?.coacPrivacy) window.history.back();
    else window.history.replaceState(state, "", window.location.pathname + window.location.search);
  }, []);

  return { privacyOpen: open, openPrivacy, closePrivacy };
}
