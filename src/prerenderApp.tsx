import { renderToStaticMarkup } from "react-dom/server";
import VariantE from "./variants/VariantE";
import { PrerenderContext } from "./variants/prerender";

/**
 * Entrada del prerender: `vite-plugin-seo.ts` la carga con `ssrLoadModule` en cada
 * build y mete el resultado en `#root`. Es la misma app que ve el usuario (React la
 * sustituye con `createRoot`), con la hora fija `now` y sin lo que cambia por horas.
 */
export function renderApp(now: Date): string {
  return renderToStaticMarkup(
    <PrerenderContext.Provider value={{ now }}>
      <VariantE />
    </PrerenderContext.Provider>,
  );
}
