import { createContext, useContext } from "react";

/**
 * Datos del prerender: el build pinta VariantE en HTML estático (ver
 * `src/prerender.tsx`) con esta hora fija y sin nada que cambie por horas. Solo
 * existe durante ese render: en el navegador el contexto vale `null` y la app
 * funciona como siempre.
 */
export interface PrerenderInfo {
  /** Mediodía (hora de Madrid) del día del build: «Hoy» y «Mañana» valen todo el día. */
  now: Date;
}

export const PrerenderContext = createContext<PrerenderInfo | null>(null);

/** `null` en el navegador; los datos del prerender mientras el build genera el HTML. */
export const usePrerender = () => useContext(PrerenderContext);
