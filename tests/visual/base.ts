import { expect, test as base } from "@playwright/test";
import { readFileSync } from "node:fs";

// La fuente de la cuenta atrás viene de un CDN en producción. En los tests se
// sirve desde tests/fixtures/dseg/ (mismo archivo, licencia SIL OFL incluida):
// así las capturas no dependen de la red ni del CDN.
const dsegFont = readFileSync(new URL("../fixtures/dseg/DSEG7Classic-Bold.woff2", import.meta.url));

export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.route("https://cdn.jsdelivr.net/**", (route) =>
      route.fulfill({
        body: dsegFont,
        contentType: "font/woff2",
        headers: { "access-control-allow-origin": "*" },
      }),
    );
    await provide(page);
  },
});

export { expect };
