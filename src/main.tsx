import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "@luz-ds/core/theme-mode";
import "./styles/index.css";

// El build ya ha pintado la app en #root (vite-plugin-seo.ts): React la sustituye sin
// hidratar. Lo que se escribió en el buscador antes de que cargara no se pierde.
const search = document.getElementById("coac-search") as HTMLInputElement | null;
const typed = search?.value ?? "";
const focused = search !== null && document.activeElement === search;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App initialTerm={typed} restoreSearchFocus={focused} />
  </React.StrictMode>,
);
