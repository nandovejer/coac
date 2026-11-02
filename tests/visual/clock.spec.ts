import { expect, test } from "@playwright/test";

// Bug de la web anterior: la hora se calculaba una sola vez al cargar, así que
// con la pestaña abierta el "EN DIRECTO" y la sesión de hoy no avanzaban.

test("el EN DIRECTO avanza sin recargar la página", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-02-12T20:10:00+01:00") });
  await page.goto("./");

  const live = page.locator("article", { hasText: "EN DIRECTO" });
  await expect(live).toHaveCount(1);
  const firstId = await live.getAttribute("id");

  await page.clock.runFor(100 * 60 * 1000);

  await expect(live).toHaveCount(1);
  expect(await live.getAttribute("id")).not.toBe(firstId);
});

test("al llegar la hora de corte la sesión nueva pasa a ser la de hoy sin recargar", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-02-13T08:59:00+01:00") });
  await page.goto("./");

  const present = page.locator("#session-present");
  await expect(present.locator('[id="12/02/2026"]')).toBeVisible();

  await page.clock.runFor(90 * 1000);

  await expect(present.locator('[id="13/02/2026"]')).toBeVisible();
  await expect(present.locator('[id="12/02/2026"]')).toHaveCount(0);
});

test("al volver a la pestaña se refresca la hora", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-02-12T20:10:00+01:00") });
  await page.goto("./");
  const live = page.locator("article", { hasText: "EN DIRECTO" });
  const firstId = await live.getAttribute("id");

  // Pasa el tiempo "con la pestaña dormida" y luego vuelve a ser visible.
  await page.clock.setFixedTime(new Date("2026-02-12T21:50:00+01:00"));
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));

  await expect(live).toHaveCount(1);
  expect(await live.getAttribute("id")).not.toBe(firstId);
});
