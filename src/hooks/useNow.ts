import { useEffect, useState } from "react";

/**
 * Hora actual, refrescada cada `intervalMs` y al volver a la pestaña (el
 * navegador congela los temporizadores en segundo plano). Así el "en directo"
 * y la sesión de hoy avanzan sin recargar.
 */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    const interval = setInterval(refresh, intervalMs);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs]);

  return now;
}
