import React, { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "@luz-ds/core/theme-mode";
import "./styles/index.css";

// Prototipo de rediseño, solo en desarrollo: `vite --mode variant-d`
// (ver src/variants/: D es la estructura de VariantC con la piel de VariantD.css). En el build de producción esto se elimina.
const variants: Record<string, LazyExoticComponent<ComponentType>> = import.meta.env.DEV
  ? {
      "variant-d": lazy(() => import("./variants/VariantD")),
    }
  : {};
const Variant = variants[import.meta.env.MODE];

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {Variant ? (
      <Suspense fallback={null}>
        <Variant />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
