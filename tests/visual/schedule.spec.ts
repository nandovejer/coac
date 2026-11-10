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
  await page.getByRole("button", { name: "Busca por autor@ o agrupación" }).click();
  await page.getByLabel("Buscar por autor@").fill("ma");
  await expect(page.locator(".coac-result").first()).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveScreenshot("buscador-con-resultados.png");
});

test("la tarjeta del buscador trae todos los datos de la tabla", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-02-09T12:00:00+01:00"));
  await page.goto("./");
  await page.getByRole("button", { name: "Busca por autor@ o agrupación" }).click();
  await page.getByLabel("Buscar por autor@").fill("Manuel Cornejo");
  const card = page.locator(".coac-result").first();
  const row = page.locator(`#${(await card.locator(".coac-result__link").getAttribute("href"))?.slice(1)}`);

  // Todo lo que muestra la fila del programa, en la tarjeta
  for (const selector of [
    ".coac-performance__author",
    ".coac-performance__name",
    ".coac-performance__city",
    ".coac-badge",
  ]) {
    const rowText = (await row.locator(selector).first().innerText()).trim();
    await expect(card).toContainText(rowText);
  }
  const rowTime = (await row.locator(".coac-performance__time").innerText())
    .replace(/\s*aprox\.?/, "")
    .trim();
  await expect(card).toContainText(rowTime);
  await expect(card.locator(".coac-result__when")).toContainText(/\d{2}:\d{2} aprox\./);
});

test("al pulsar una tarjeta se cierra el modal y se baja a la fila de la agrupación", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-02-09T12:00:00+01:00"));
  await page.goto("./");
  await page.getByRole("button", { name: "Busca por autor@ o agrupación" }).click();
  await page.getByLabel("Buscar por autor@").fill("Manuel Cornejo");
  const link = page.locator(".coac-result__link").first();
  const href = await link.getAttribute("href");
  await link.click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.locator(href as string)).toBeInViewport();
});

test("el modal del buscador se cierra con Escape y avisa si no hay resultados", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Busca por autor@ o agrupación" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Buscar por autor@").fill("zzzzzz");
  await expect(
    page.getByRole("status").filter({ hasText: "No hay ninguna agrupación que coincida" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("«Buscar» del menú inferior abre el buscador", async ({ page }) => {
  await page.goto("./");
  const menu = page.locator(".coac-bottom-nav");
  test.skip(!(await menu.isVisible()), "sin menú inferior en este ancho");
  await menu.getByRole("link", { name: "Buscar" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("la barra superior aparece al pasar el hero (solo móvil)", async ({ page }) => {
  // Con la sesión de hoy desplegada, la página es lo bastante larga para hacer scroll
  await page.clock.setFixedTime(new Date("2026-02-12T20:10:00+01:00"));
  await page.goto("./");
  const bar = page.locator(".coac-topbar");
  test.skip(!(await page.locator(".coac-bottom-nav").isVisible()), "en escritorio el panel ya es fijo");

  await expect(bar).toBeHidden();
  await page.locator("#siteMain").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 400));
  await expect(bar).toBeVisible();
  await expect(bar).toContainText("¿Quién canta hoy en el COAC");
  await bar.getByRole("link", { name: "Abrir el buscador" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(bar).toBeHidden();
});

test("el hero tiene título, descripción y cuenta atrás", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-02-09T12:00:00+01:00"));
  await page.goto("./");
  const hero = page.locator("#siteHeader");
  await expect(hero.getByRole("heading", { level: 1 })).toContainText("¿Quién canta hoy en el COAC");
  await expect(hero.locator(".coac-hero__description")).toBeVisible();
  await expect(hero.locator(".coac-countdown")).toBeVisible();
});

test("el buscador filtra por modalidad y encuentra por nombre de agrupación", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-02-09T12:00:00+01:00"));
  await page.goto("./");
  await page.getByRole("button", { name: "Busca por autor@ o agrupación" }).click();

  // Solo con la modalidad, sin escribir
  await page.getByRole("button", { name: "Cuarteto" }).click();
  await expect(page.getByRole("button", { name: "Cuarteto" })).toHaveAttribute("aria-pressed", "true");
  const badges = page.locator(".coac-result .coac-badge");
  await expect(badges.first()).toBeVisible();
  for (const text of await badges.allInnerTexts()) expect(text).toBe("CUARTETO");

  // Texto + «Todas»: por nombre de agrupación
  await page.getByRole("button", { name: "Todas" }).click();
  const nombre = (await page.locator(".coac-performance__name").first().innerText()).trim();
  await page.getByLabel("Buscar por autor@").fill(nombre);
  await expect(page.locator(".coac-result", { hasText: nombre }).first()).toBeVisible();
});

test("la barra superior lleva la cuenta atrás en marquesina y se puede pausar (solo móvil)", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-02-09T12:00:00+01:00"));
  await page.goto("./");
  test.skip(!(await page.locator(".coac-bottom-nav").isVisible()), "en escritorio el panel ya es fijo");

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const ticker = page.locator(".coac-topbar .coac-ticker");
  await expect(ticker).toBeVisible();
  await expect(ticker).toContainText("Próxima sesión");
  await expect(ticker).toHaveAttribute("aria-pressed", "false");
  await ticker.click();
  await expect(ticker).toHaveAttribute("aria-pressed", "true");
});
