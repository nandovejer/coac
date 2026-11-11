import { defineConfig } from "@playwright/test";

const PORT = 4173;

// Los tests visuales corren contra un build en modo "e2e" que sustituye el
// JSON de la fase por tests/fixtures/sessions.json (ver vite.config.ts), para
// no depender de la fase en curso.
export default defineConfig({
  testDir: "tests/visual",
  fullyParallel: true,
  reporter: [["list"]],
  expect: { toHaveScreenshot: { maxDiffPixels: 0 } },
  use: {
    baseURL: `http://localhost:${PORT}/coac/`,
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
  },
  projects: [
    {
      name: "movil",
      use: { browserName: "chromium", viewport: { width: 390, height: 844 } },
    },
    {
      name: "escritorio",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: `pnpm exec vite build --mode e2e --outDir dist-e2e && pnpm exec vite preview --mode e2e --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/coac/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
