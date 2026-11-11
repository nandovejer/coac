import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";
import seoPlugin from "./vite-plugin-seo";

// La web se sirve en la raíz de su dominio (coac.com.es, GitHub Pages con
// dominio propio). Si cambia de sitio, cambia también las URL de `site.ts`,
// `robots.txt` y `site.webmanifest`.
const BASE = "/";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), seoPlugin()],
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
