import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./base";

// Modos de color de Luz: claro, oscuro y alto contraste.

// Las capturas de oscuro y alto contraste admiten unos pocos píxeles de
// diferencia: el texto con degradado (background-clip: text) varía en un píxel
// de una ejecución a otra. El modo claro (schedule.spec.ts) exige cero.
const tolerance = { maxDiffPixels: 10 };

type Mode = "light" | "dark" | "high-contrast";
const modes: Mode[] = ["light", "dark", "high-contrast"];
// background-color de <body> en cada modo (`--ve-page-bg` de VariantE.css, el mismo fondo
// que la app: así no cambia al montar ni en el rebote de iOS)
const pageBackground: Record<Mode, string> = {
  light: "rgb(239, 240, 245)",
  dark: "rgb(17, 17, 24)",
  "high-contrast": "rgb(255, 255, 255)",
};

async function openIn(page: Page, mode: Mode, at: string) {
  await page.addInitScript((m) => localStorage.setItem("luz-theme", m), mode);
  await page.clock.setFixedTime(new Date(at));
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-mode", mode);
}

for (const mode of ["dark", "high-contrast"] as const) {
  test(`${mode}: sesión de hoy en directo`, async ({ page }) => {
    await openIn(page, mode, "2026-02-12T20:10:00+01:00");
    await expect(page).toHaveScreenshot(`${mode}-sesion-de-hoy-en-directo.png`, {
      fullPage: true,
      ...tolerance,
    });
  });

  test(`${mode}: antes de la primera sesión (cuenta atrás)`, async ({ page }) => {
    await openIn(page, mode, "2026-02-09T12:00:00+01:00");
    await expect(page).toHaveScreenshot(`${mode}-antes-de-la-primera-sesion.png`, {
      fullPage: true,
      ...tolerance,
    });
  });

  test(`${mode}: buscador de autores con resultados`, async ({ page }) => {
    await openIn(page, mode, "2026-02-09T12:00:00+01:00");
    await page.getByRole("button", { name: "Busca por autor@ o agrupación" }).click();
    await page.getByLabel("Buscar por autor@").fill("ma");
    await expect(page.locator(".coac-result").first()).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveScreenshot(`${mode}-buscador-con-resultados.png`, tolerance);
  });
}

test("el selector de modo recorre los modos y se recuerda al recargar", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-02-12T20:10:00+01:00"));
  await page.goto("./");
  const html = page.locator("html");
  const button = page.locator(".luz-theme-mode__button");

  await expect(html).toHaveAttribute("data-mode", "light");
  await button.click(); // auto → claro
  await button.click(); // claro → oscuro
  await expect(html).toHaveAttribute("data-mode", "dark");
  await expect(page.locator("body")).toHaveCSS("background-color", pageBackground.dark);
  expect(await page.evaluate(() => localStorage.getItem("luz-theme"))).toBe("dark");

  await button.click(); // oscuro → alto contraste
  await expect(html).toHaveAttribute("data-mode", "high-contrast");
  await expect(page.locator("body")).toHaveCSS("background-color", pageBackground["high-contrast"]);

  await page.reload();
  await expect(html).toHaveAttribute("data-mode", "high-contrast");
});

test("Auto sigue el modo del sistema", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");
});

test("el modo guardado se aplica antes de que cargue la app (sin destello)", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("luz-theme", "dark"));
  await page.route("**/assets/*.js", (route) => route.abort()); // solo el HTML estático y el script de arranque
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");
  await expect(page.locator("body")).toHaveCSS("background-color", pageBackground.dark);
});

test("el botón del selector va en el pie, no flotando sobre el contenido", async ({ page }) => {
  await page.goto("./");
  const button = page.locator(".luz-theme-mode__button");
  await expect(button).toBeVisible();
  await expect(button).not.toHaveClass(/luz-theme-mode__button--fixed/);
  await expect(page.locator(".coac-site-footer").locator(".luz-theme-mode__button")).toHaveCount(1);
});

test("el selector tiene nombre accesible y avisa del modo elegido", async ({ page }) => {
  await page.goto("./");
  const button = page.locator(".luz-theme-mode__button");
  await expect(button).toHaveAttribute("aria-label", /Modo de color: Auto/);
  await button.click();
  await expect(button).toHaveAttribute("aria-label", /Modo de color: Claro/);
});

// Accesibilidad (axe): sin excepciones en ningún modo.
const axeScenes = [
  { name: "sesión en directo", at: "2026-02-12T20:10:00+01:00" },
  { name: "cuenta atrás", at: "2026-02-09T12:00:00+01:00" },
];

for (const mode of modes) {
  for (const { name, at } of axeScenes) {
    test(`axe sin violaciones en modo ${mode}: ${name}`, async ({ page }) => {
      await openIn(page, mode, at);
      const axe = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]);
      const { violations } = await axe.analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual(
        [],
      );
    });
  }
}
