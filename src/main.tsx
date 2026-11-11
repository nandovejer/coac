import React, { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import ReactDOM from "react-dom/client";
import App from "./variants/VariantE";
import "@luz-ds/core/theme-mode";
import "./styles/index.css";
// El HTML estático del SEO (vite-plugin-seo.ts) pinta la cabecera de SiteHeader
// hasta que React lo sustituye: su CSS tiene que estar en el build.
import "./components/layout/SiteHeader.css";

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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {DevApp ? (
      <Suspense fallback={null}>
        <DevApp />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
