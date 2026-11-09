import { expect, test } from "./base";

// Red de seguridad del refactor: la web debe verse y comportarse igual.
// Cada escenario fija la hora (Europe/Madrid, ver playwright.config.ts) contra
// el fixture tests/fixtures/sessions.json (sesiones 11, 12 y 13/02/2026).
// Las horas están elegidas para que el escenario no dependa de los minutos por
// agrupación de season.ts: a las 20:10 canta siempre la primera agrupación.
const scenarios = [
  { name: "antes-de-la-primera-sesion", at: "2026-02-09T12:00:00+01:00" },
  { name: "sesion-de-hoy-en-directo", at: "2026-02-12T20:10:00+01:00" },
  { name: "madrugada-sigue-la-sesion-de-ayer", at: "2026-02-13T00:30:00+01:00" },
  { name: "fase-terminada", at: "2026-02-20T12:00:00+01:00" },
];

for (const { name, at } of scenarios) {
  test(name, async ({ page }) => {
    await page.clock.setFixedTime(new Date(at));
    await page.goto("./");
    await expect(page.locator("#siteMain")).toBeVisible();
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}

test("buscador de autores con resultados", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-02-09T12:00:00+01:00"));
  await page.goto("./");
  await page.getByLabel("Buscar por autor@").fill("ma");
  await expect(page.locator("#searchAuthor a").first()).toBeVisible();
  await expect(page.locator("#searchAuthor")).toHaveScreenshot("buscador-con-resultados.png");
});

test("el enlace de un resultado del buscador lleva a la fila de la agrupación", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-02-09T12:00:00+01:00"));
  await page.goto("./");
  await page.getByLabel("Buscar por autor@").fill("Manuel Cornejo");
  const result = page.locator("#searchAuthor a").first();
  const href = await result.getAttribute("href");
  await result.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.locator(href as string)).toBeInViewport();
});
