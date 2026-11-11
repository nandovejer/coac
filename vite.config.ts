import { defineConfig } from "vitest/config";
import type { Connect, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";
import seoPlugin from "./vite-plugin-seo";

const BASE = "/coac/";

/**
 * En local (dev y preview), `localhost:puerto/` lleva directamente a la app.
 * La base es la misma que en GitHub Pages, así que una ruta mal puesta se ve
 * también en local.
 */
function redirectRootToBase(): Plugin {
  const redirect: Connect.NextHandleFunction = (req, res, next) => {
    if (req.url !== "/" && req.url !== "/index.html") return next();
    res.statusCode = 302;
    res.setHeader("Location", BASE);
    res.end();
  };
  return {
    name: "coac-redirect-root-to-base",
    configureServer: (server) => void server.middlewares.use(redirect),
    configurePreviewServer: (server) => void server.middlewares.use(redirect),
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), seoPlugin(), redirectRootToBase()],
  base: BASE,
  // En modo "e2e" (tests visuales) la configuración de la fase y cualquier JSON
  // de fase se sustituyen por fixtures fijos, para que las capturas no dependan
  // de la fase en curso.
  resolve:
    mode === "e2e"
      ? {
          alias: [
            {
              find: /^(.*\/)?config\/season(\.ts)?$/,
              replacement: fileURLToPath(new URL("./tests/fixtures/season.ts", import.meta.url)),
            },
            {
              find: /^.*\/COAC_\d{4}_[A-Z]+\.json$/,
              replacement: fileURLToPath(new URL("./tests/fixtures/sessions.json", import.meta.url)),
            },
          ],
        }
      : undefined,
  build: {
    rollupOptions: {
      output: {
        // React cambia muy poco entre fases: en su propio chunk el navegador lo
        // reutiliza de caché y solo descarga el código de la app al desplegar.
        manualChunks: { react: ["react", "react-dom"] },
      },
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    // La zona del proceso es UTC (distinta de Europe/Madrid) para demostrar
    // que la lógica de sesiones no depende de la máquina.
    globalSetup: ["./tests/vitest-global-setup.ts"],
  },
}));
