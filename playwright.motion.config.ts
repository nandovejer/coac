import { defineConfig } from "@playwright/test";

const PORT = 4174;

// Pruebas del movimiento de la app publicada, según
// las reglas de «Movimiento» de AGENTS.md. Corren contra el mismo build «e2e» que las
// visuales (datos de tests/fixtures/), en móvil y en escritorio.
export default defineConfig({
  testDir: "tests/motion",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}/`,
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
  },
  projects: [
    { name: "movil", use: { browserName: "chromium", viewport: { width: 390, height: 844 } } },
    { name: "escritorio", use: { browserName: "chromium", viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: `pnpm exec vite build --mode e2e --outDir dist-e2e-motion && pnpm exec vite preview --mode e2e --outDir dist-e2e-motion --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
