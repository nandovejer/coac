import { renderToStaticMarkup } from "react-dom/server";
import App from "./app/App";
import { PrerenderContext } from "./app/prerenderContext";

/**
 * Entrada del prerender: `vite-plugin-seo.ts` la carga con `ssrLoadModule` en cada
 * build y mete el resultado en `#root`. Es la misma app que ve el usuario (React la
 * sustituye con `createRoot`), con la hora fija `now` y sin lo que cambia por horas.
 */
export function renderApp(now: Date): string {
  return renderToStaticMarkup(
    <PrerenderContext.Provider value={{ now }}>
      <App />
    </PrerenderContext.Provider>,
  );
}
