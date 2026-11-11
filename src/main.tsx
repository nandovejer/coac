import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./variants/VariantD";
import "@luz-ds/core/theme-mode";
import "./styles/index.css";
// El HTML estático del SEO (vite-plugin-seo.ts) pinta la cabecera de SiteHeader
// hasta que React lo sustituye: su CSS tiene que estar en el build.
import "./components/layout/SiteHeader.css";

// La app es el prototipo D (src/variants/). La anterior queda solo en
// desarrollo, para compararlas: `vite --mode anterior`. En el build de
// producción esta rama se elimina.
const PreviousApp =
  import.meta.env.DEV && import.meta.env.MODE === "anterior" ? lazy(() => import("./App.tsx")) : null;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {PreviousApp ? (
      <Suspense fallback={null}>
        <PreviousApp />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
