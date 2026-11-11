import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Pruebas del plan de animaciones (.claude/plans/PLAN-ANIMACIONES.md). Datos de
// tests/fixtures: sesiones del 11, 12 y 13 de febrero de 2026, a las 20:00.
const LIVE = new Date("2026-02-12T21:00:00+01:00");
const BEFORE_START = new Date("2026-02-12T19:59:50+01:00");
const FUTURE = new Date("2026-02-01T12:00:00+01:00");

/** Cuenta las llamadas a startViewTransition (o la quita, para probar sin soporte). */
async function spyViewTransitions(page: Page, remove = false) {
  await page.addInitScript((remove) => {
    const w = window as unknown as { __vtCalls: number };
    w.__vtCalls = 0;
    const doc = document as unknown as { startViewTransition?: (...args: unknown[]) => unknown };
    const original = doc.startViewTransition?.bind(document);
    if (remove) delete doc.startViewTransition;
    else if (original) {
      doc.startViewTransition = (...args) => {
        w.__vtCalls++;
        return original(...args);
      };
    }
  }, remove);
}

const vtCalls = (page: Page) => page.evaluate(() => (window as unknown as { __vtCalls: number }).__vtCalls);

test.describe("con «reducir movimiento»", () => {
  test.use({ reducedMotion: "reduce" });

  test("solo quedan transiciones de color, borde y sombra, y ninguna View Transition", async ({ page }) => {
    await spyViewTransitions(page);
    await page.clock.install({ time: LIVE });
    await page.goto("./");
    await page.clock.resume();

    const inventory = async () =>
      page.evaluate(() =>
        document
          .getAnimations()
          .filter((a): a is CSSTransition => a instanceof CSSTransition)
          .map((a) => a.transitionProperty),
      );
    const allowed = /(color|shadow)$/i;

    await page.locator(".coac-ve__day").nth(2).click();
    expect((await inventory()).filter((p) => !allowed.test(p))).toEqual([]);
    await page.locator(".coac-ve__chip").nth(1).click();
    expect((await inventory()).filter((p) => !allowed.test(p))).toEqual([]);
    await page.locator(".coac-ve__footer-page", { hasText: "Quiénes somos" }).click();
    await page.locator(".coac-info__close").click();
    expect((await inventory()).filter((p) => !allowed.test(p))).toEqual([]);
    expect(await vtCalls(page)).toBe(0);
  });
});

test.describe("elegir un día", () => {
  const run = async (page: Page, remove: boolean) => {
    await spyViewTransitions(page, remove);
    await page.goto("./");
    await page.locator(".coac-ve__day").nth(2).click();
    await page.waitForTimeout(800);
    return page.evaluate(() => ({
      y: Math.round(scrollY),
      active: document.activeElement?.className,
      sessions: document.querySelectorAll("main section.coac-ve__session").length,
      named: document.querySelector(".coac-ve")?.hasAttribute("data-vt"),
    }));
  };

  test("con y sin View Transition acaba igual: mismo foco y mismo scroll", async ({ page, browser }) => {
    const withVt = await run(page, false);
    const second = await (await browser.newContext({ viewport: page.viewportSize() ?? undefined })).newPage();
    const withoutVt = await run(second, true);
    expect(withVt.active).toBe("coac-ve__day");
    expect(withVt.active).toBe(withoutVt.active);
    expect(Math.abs(withVt.y - withoutVt.y)).toBeLessThanOrEqual(1);
    expect(withVt.sessions).toBe(1);
    expect(withVt.named).toBe(false);
  });

  test("durante la transición nada se funde ni usa plus-lighter", async ({ page }) => {
    await page.addInitScript(() => {
      const original = document.startViewTransition.bind(document);
      document.startViewTransition = (...args: Parameters<typeof original>) => {
        const transition = original(...args);
        (window as unknown as { __vt: ViewTransition }).__vt = transition;
        return transition;
      };
    });
    await page.goto("./");
    await page.locator(".coac-ve__day").nth(2).click();
    const styles = await page.evaluate(async () => {
      await (window as unknown as { __vt: ViewTransition }).__vt.ready;
      const read = (selector: string) => {
        const s = getComputedStyle(document.documentElement, selector);
        return { blend: s.mixBlendMode, opacity: s.opacity };
      };
      return [
        read("::view-transition-old(root)"),
        read("::view-transition-new(root)"),
        read("::view-transition-old(ve-list)"),
        read("::view-transition-new(ve-list)"),
      ];
    });
    for (const style of styles) expect(style.blend).toBe("normal");
    // Sin opacidad intermedia declarada: las capturas de la lista van opacas
    expect(styles[2].opacity).toBe("1");
    expect(styles[3].opacity).toBe("1");
  });
});

test("«Ver todo el programa» deja el foco en un título de sesión, no en <body>", async ({ page }) => {
  await page.goto("./");
  await page.locator(".coac-ve__day").nth(1).click();
  await page.locator(".coac-ve__reset").click();
  await page.waitForTimeout(800);
  const focused = await page.evaluate(() => document.activeElement?.className);
  expect(focused).toBe("coac-ve__session-title");
});

test.describe("modales", () => {
  test("al cerrar, el foco vuelve a quien lo abrió y el diálogo queda inerte mientras sale", async ({
    page,
  }) => {
    await page.goto("./");
    const opener = page.locator(".coac-ve__footer-page", { hasText: "Quiénes somos" });
    await opener.click();
    await page.locator(".coac-info__close").click();
    const state = await page.evaluate(() => {
      const dialog = document.querySelector<HTMLDialogElement>("dialog.coac-info");
      return { inert: dialog?.inert ?? true, focus: document.activeElement?.textContent?.trim() };
    });
    expect(state.inert).toBe(true);
    expect(state.focus).toBe("Quiénes somos");
    await expect(page.locator("dialog.coac-info")).toHaveCount(0);
  });
});

test.describe("regiones vivas y estado de la sesión", () => {
  test("al escribir una palabra, la región viva cambia una sola vez", async ({ page }) => {
    await page.goto("./");
    const announcer = page.locator(".coac-ve__announcer");
    await expect(announcer).toHaveCount(1);
    await expect(announcer).toHaveText("");
    await page.evaluate(() => {
      const w = window as unknown as { __changes: string[] };
      w.__changes = [];
      const el = document.querySelector(".coac-ve__announcer");
      if (el)
        new MutationObserver(() => w.__changes.push(el.textContent ?? "")).observe(el, {
          childList: true,
          characterData: true,
          subtree: true,
        });
    });
    await page.locator("#ve-search").pressSequentially("mar", { delay: 80 });
    await page.waitForTimeout(900);
    const changes = await page.evaluate(() => (window as unknown as { __changes: string[] }).__changes);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatch(/agrupaci(ón|ones) encontrada/);
  });

  test("al empezar la sesión nunca se lee «La fase ha terminado» y se anuncia una vez el directo", async ({
    page,
  }) => {
    await page.clock.install({ time: BEFORE_START });
    await page.goto("./");
    const status = page.locator(".coac-ve__status");
    await page.evaluate(() => {
      const w = window as unknown as { __live: string[] };
      w.__live = [];
      const el = document.querySelector(".coac-ve__announcer");
      if (el)
        new MutationObserver(() => el.textContent && w.__live.push(el.textContent)).observe(el, {
          childList: true,
          characterData: true,
          subtree: true,
        });
    });
    const titles = new Set<string>();
    for (let i = 0; i < 45; i++) {
      await page.clock.runFor(1000);
      titles.add((await status.locator(".coac-ve__status-title").first().textContent()) ?? "");
    }
    expect(titles.has("La fase ha terminado")).toBe(false);
    expect(titles.has("Empieza la sesión")).toBe(true);
    await expect(status).toHaveAttribute("data-state", "live");
    const announced = await page.evaluate(() => (window as unknown as { __live: string[] }).__live);
    expect(announced.filter((text) => text.startsWith("Empieza la sesión. Actúa"))).toHaveLength(1);
  });

  test("al cargar la página ya en directo no se anuncia nada", async ({ page }) => {
    await page.clock.install({ time: LIVE });
    await page.goto("./");
    await page.clock.runFor(10_000);
    await expect(page.locator(".coac-ve__announcer")).toHaveText("");
  });
});

test.describe("rendimiento", () => {
  test("la cuenta atrás no vuelve a pintar el programa", async ({ page }) => {
    await page.clock.install({ time: FUTURE });
    await page.goto("./");
    await page.evaluate(() => {
      const w = window as unknown as { __mutations: number };
      w.__mutations = 0;
      const sessions = document.querySelector(".coac-ve__sessions");
      if (sessions)
        new MutationObserver((list) => (w.__mutations += list.length)).observe(sessions, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true,
        });
    });
    for (let i = 0; i < 5; i++) await page.clock.runFor(1000);
    expect(await page.evaluate(() => (window as unknown as { __mutations: number }).__mutations)).toBe(0);
  });

  test("en directo y quieta, solo se mueven los puntos de «en directo»", async ({ page }) => {
    await page.clock.install({ time: LIVE });
    await page.goto("./");
    await page.clock.resume();
    await page.waitForTimeout(1500);
    const running = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a.playState === "running")
        .map((a) => (a instanceof CSSAnimation ? a.animationName : "transition")),
    );
    expect(running.filter((name) => name !== "coac-ve-dot")).toEqual([]);
  });

  test("los segundos de la cuenta atrás no se animan", async ({ page }) => {
    await page.clock.install({ time: FUTURE });
    await page.goto("./");
    for (let i = 0; i < 3; i++) {
      await page.clock.runFor(1000);
      const count = await page.evaluate(
        () => document.querySelectorAll(".coac-ve__digit")[3]?.getAnimations({ subtree: true }).length ?? -1,
      );
      expect(count).toBe(0);
    }
  });
});

test.describe("contraste a mitad de una animación", () => {
  for (const mode of ["light", "dark", "high-contrast"] as const) {
    test(`el paso a directo mantiene el contraste (${mode})`, async ({ page }) => {
      await page.addInitScript((m) => localStorage.setItem("luz-theme", m), mode);
      await page.clock.install({ time: BEFORE_START });
      await page.goto("./");
      for (let i = 0; i < 45; i++) await page.clock.runFor(1000);
      for (const k of [0.25, 0.5, 0.75]) {
        await page.evaluate((k) => {
          for (const a of document.querySelector(".coac-ve__status")?.getAnimations({ subtree: true }) ??
            []) {
            a.pause();
            a.currentTime = Number(a.effect?.getComputedTiming().endTime ?? 0) * k;
          }
        }, k);
        const result = await new AxeBuilder({ page })
          .include(".coac-ve__status")
          .withRules(["color-contrast"])
          .analyze();
        expect(result.violations, `k=${k}`).toEqual([]);
      }
    });
  }
});

test.describe("tanda 2", () => {
  const ghosts = (page: Page, selector: string) =>
    page.evaluate((selector) => {
      const w = window as unknown as { __ghosts: string[] };
      w.__ghosts = [];
      const host = document.querySelector(selector);
      if (host)
        new MutationObserver((records) =>
          records.forEach((r) =>
            r.addedNodes.forEach(
              (n) =>
                n instanceof HTMLElement &&
                n.classList.contains("coac-ve__ghost") &&
                w.__ghosts.push(n.dataset.kind ?? ""),
            ),
          ),
        ).observe(host, { childList: true });
    }, selector);
  const seen = (page: Page) => page.evaluate(() => (window as unknown as { __ghosts: string[] }).__ghosts);

  test("al cambiar de día y de modalidad viaja una ficha, y se retira sola", async ({ page }) => {
    await page.goto("./");
    await ghosts(page, ".coac-ve__carousel");
    await page.locator(".coac-ve__day").nth(0).click();
    await page.waitForTimeout(700);
    await page.locator(".coac-ve__day").nth(1).click();
    await page.waitForTimeout(700);
    expect(await seen(page)).toContain("day");
    await expect(page.locator(".coac-ve__ghost")).toHaveCount(0);
    await expect(page.locator("[data-ghosting]")).toHaveCount(0);
  });

  test("con «reducir movimiento» no viaja ninguna ficha", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", baseURL });
    const page = await context.newPage();
    await page.goto("./");
    await ghosts(page, ".coac-ve__chips");
    await page.locator(".coac-ve__chip").nth(1).click();
    await page.locator(".coac-ve__chip").nth(2).click();
    await page.waitForTimeout(500);
    expect(await seen(page)).toEqual([]);
    await context.close();
  });

  test("al elegir modalidad no quedan nombres de transición y al escribir no hay ninguna", async ({
    page,
  }) => {
    await spyViewTransitions(page);
    await page.goto("./");
    await page.locator(".coac-ve__chip").nth(2).click();
    await page.waitForTimeout(800);
    expect(await vtCalls(page)).toBe(1);
    await expect(page.locator("[data-vt-card]")).toHaveCount(0);
    await expect(page.locator(".coac-ve[data-vt]")).toHaveCount(0);
    await page.locator("#ve-search").pressSequentially("mar", { delay: 50 });
    await page.waitForTimeout(300);
    expect(await vtCalls(page)).toBe(1);
  });

  test("el cambio de modo da la misma vuelta con y sin View Transition", async ({ page, browser }) => {
    const cycle = async (target: Page, remove: boolean) => {
      await spyViewTransitions(target, remove);
      await target.goto("./");
      await target.evaluate(() => {
        const w = window as unknown as { __modes: string[] };
        w.__modes = [];
        document.addEventListener("luz-theme-mode:change", (e) =>
          w.__modes.push((e as CustomEvent).detail.mode),
        );
      });
      const button = target.locator(".luz-theme-mode__button");
      await button.scrollIntoViewIfNeeded();
      const modes: string[] = [];
      for (let i = 0; i < 3; i++) {
        await button.click();
        await target.waitForTimeout(700);
        modes.push(
          await target.evaluate(
            () =>
              `${document.documentElement.dataset.mode}|${localStorage.getItem("luz-theme")}|${document.activeElement?.className}|${document.querySelector(".luz-theme-mode__status")?.textContent}`,
          ),
        );
      }
      return {
        modes,
        events: await target.evaluate(() => (window as unknown as { __modes: string[] }).__modes),
        calls: await vtCalls(target),
      };
    };
    const withVt = await cycle(page, false);
    const second = await (
      await browser.newContext({
        viewport: page.viewportSize() ?? undefined,
        baseURL: "http://localhost:4174/coac/",
      })
    ).newPage();
    const withoutVt = await cycle(second, true);
    expect(withVt.modes).toEqual(withoutVt.modes);
    expect(withVt.events).toEqual(withoutVt.events);
    expect(withVt.calls).toBe(3);
    expect(withoutVt.calls).toBe(0);
    expect(
      withVt.modes.every((m) => m.includes("luz-theme-mode__button") && m.includes("Modo de color")),
    ).toBe(true);
  });

  test("el aviso de privacidad sale tras 600 ms y «Lo entiendo» no deja el foco en <body>", async ({
    page,
  }) => {
    await page.goto("./");
    await expect(page.locator(".coac-privacy-notice")).toHaveCount(0);
    const ok = page.locator(".coac-privacy-notice__ok");
    await ok.waitFor();
    await ok.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".coac-privacy-notice")).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("siteMain");
  });

  test("la barra del turno avanza por pasos y quieta no se anima", async ({ page }) => {
    await page.clock.install({ time: LIVE });
    await page.goto("./");
    await page.clock.resume();
    const info = await page.evaluate(() => {
      const bar = document.querySelector(".coac-ve__progress");
      return bar
        ? {
            clip: getComputedStyle(bar, "::after").clipPath,
            transition: getComputedStyle(bar, "::after").transitionProperty,
          }
        : null;
    });
    expect(info?.clip).toMatch(/^inset\(/);
    expect(info?.transition).toBe("clip-path");
  });
});

test.describe("tanda 3", () => {
  test("la entrada de la primera carga se hace una vez por pestaña y no mueve el contenido", async ({
    page,
  }) => {
    await page.goto("./");
    await expect(page.locator(".coac-ve[data-intro]")).toHaveCount(1);
    const animated = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a instanceof CSSAnimation && /^coac-ve-(mark|segment)-in$/.test(a.animationName))
        .map((a) => (a.effect as KeyframeEffect).target?.getAttribute("class") ?? ""),
    );
    // Solo piezas decorativas: la fachada y los segmentos (nunca texto)
    expect(animated.length).toBeGreaterThan(0);
    for (const name of animated) expect(name).toMatch(/status-mark|segment/);
    await page.waitForTimeout(1700);
    await expect(page.locator(".coac-ve[data-intro]")).toHaveCount(0);
    await page.reload();
    await expect(page.locator(".coac-ve[data-intro]")).toHaveCount(0);
  });

  test("con una URL con ancla no hay entrada", async ({ page }) => {
    await page.goto("./#siteMain");
    await expect(page.locator(".coac-ve[data-intro]")).toHaveCount(0);
  });

  test("la fachada sube por minutos en la última hora, sin animación", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-02-12T19:30:30+01:00") });
    await page.goto("./");
    const read = () =>
      page.evaluate(() => ({
        curtain: document
          .querySelector<HTMLElement>(".coac-ve__status")
          ?.style.getPropertyValue("--ve-curtain"),
        animations: document.querySelector(".coac-ve__status-mark")?.getAnimations().length ?? -1,
      }));
    const before = await read();
    await page.clock.runFor(60_000);
    const after = await read();
    expect(Number(after.curtain)).toBeGreaterThan(Number(before.curtain));
    expect(after.animations).toBe(0);
  });
});
