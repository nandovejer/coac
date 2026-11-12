import React, { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import ReactDOM from "react-dom/client";
import App from "./variants/VariantE";
import "@luz-ds/core/theme-mode";
import "./styles/index.css";

// La app es el rediseño E (src/variants/). Solo en desarrollo, para
// compararlas: el prototipo D (`vite --mode variant-d`) y la app anterior
// (`vite --mode anterior`). En el build de producción esto se elimina.
const devApps: Record<string, LazyExoticComponent<ComponentType>> = import.meta.env.DEV
  ? {
      anterior: lazy(() => import("./App.tsx")),
      "variant-d": lazy(() => import("./variants/VariantD")),
    }
  : {};
const DevApp = devApps[import.meta.env.MODE];

// El build ya ha pintado la app en #root (vite-plugin-seo.ts): React la sustituye sin
// hidratar. Lo que se escribió en el buscador antes de que cargara no se pierde.
const search = document.getElementById("ve-search") as HTMLInputElement | null;
const typed = search?.value ?? "";
const focused = search !== null && document.activeElement === search;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {DevApp ? (
      <Suspense fallback={null}>
        <DevApp />
      </Suspense>
    ) : (
      <App initialTerm={typed} restoreSearchFocus={focused} />
    )}
  </React.StrictMode>,
);
