import { useEffect, useState } from "react";

/**
 * `true` desde que llega `target`. Un único temporizador (no uno por segundo),
 * así que la app solo se vuelve a pintar al llegar la hora y al volver a la pestaña.
 */
export function useReached(target: Date | null | undefined) {
  const targetMs = target ? target.getTime() : null;
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (targetMs === null) return;
    const refresh = () => setVersion((n) => n + 1);
    const wait = targetMs - Date.now();
    // setTimeout no admite más de ~24 días: si falta más, se vuelve a armar
    const timer = wait > 0 ? setTimeout(refresh, Math.min(wait, 2 ** 31 - 1)) : undefined;
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  });

  return targetMs !== null && targetMs <= Date.now();
}
