import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Vitest sustituye los .css importados por contenido vacío: se leen del disco.
const read = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");
const coacTokens = read("./coac-tokens.css");
const themeCoac = read("./theme-coac.css");

// Contraste WCAG de los colores propios (coac-tokens.css) en los modos oscuro y
// alto contraste. El modo claro conserva el aspecto original de la web y NO
// cumple AA en la cabecera de sesión, los títulos en degradado y las filas "ok"
// (deuda aceptada, ver AGENTS.md): por eso no se comprueba aquí.
// Los tokens semánticos de Luz (theme-coac.css) los comprueba
// `pnpm run check:contrast`.

type Tokens = Record<string, string>;

function parseBlocks(css: string): Array<{ selector: string; tokens: Tokens }> {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
    selector,
    tokens: Object.fromEntries(
      [...body.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g)].map(([, name, value]) => [
        name,
        value,
      ]),
    ),
  }));
}

function tokensOf(mode: "dark" | "high-contrast"): Tokens {
  const pick = (css: string) =>
    parseBlocks(css)
      .filter(({ selector }) => selector.includes(`data-mode="${mode}"`))
      .reduce<Tokens>((all, { tokens }) => ({ ...all, ...tokens }), {});
  return { ...pick(themeCoac), ...pick(coacTokens) };
}

function luminance(hex: string): number {
  const digits = hex.slice(1);
  const full = digits.length === 3 ? [...digits].map((d) => d + d).join("") : digits;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// [primer plano, fondo, mínimo]: 4,5 para texto normal, 3 para texto grande y
// elementos de interfaz.
const pairs: Array<[string, string, number]> = [
  ["--coac-header-text", "--coac-header-bg", 4.5],
  ["--coac-header-text", "--coac-panel-bg", 4.5],
  ["--coac-nav-text", "--coac-nav-bg", 4.5],
  ["--coac-nav-text", "--coac-nav-hover-from", 4.5],
  ["--coac-nav-text", "--coac-nav-hover-to", 4.5],
  ["--coac-on-gradient", "--coac-gradient-from", 4.5],
  ["--coac-on-gradient", "--coac-gradient-to", 4.5],
  ["--coac-on-header-from", "--coac-header-bg", 4.5],
  ["--coac-on-header-to", "--coac-header-bg", 4.5],
  ["--coac-gradient-from", "--luz-surface-page", 3],
  ["--coac-gradient-to", "--luz-surface-page", 3],
  ["--coac-gradient-from", "--luz-surface", 3],
  ["--coac-gradient-to", "--luz-surface", 3],
  ["--coac-chip-text", "--coac-chip-bg", 4.5],
  ["--coac-chip-text", "--coac-chip-bg-hover", 4.5],
  ["--coac-footer-text", "--coac-footer-bg", 4.5],
  ["--coac-link", "--coac-footer-bg", 4.5],
  ["--coac-link", "--luz-surface-page", 4.5],
  ["--coac-link", "--luz-surface", 4.5],
  ["--coac-placeholder", "--luz-input-bg", 4.5],
  ["--coac-input-border", "--luz-input-bg", 3],
  ["--coac-live-text", "--coac-live-bg", 4.5],
  ...["coro", "comparsa", "chirigota", "cuarteto"].map((m): [string, string, number] => [
    `--coac-modalidad-${m}-text`,
    `--coac-modalidad-${m}-bg`,
    4.5,
  ]),
  ...["top", "ok", "standar"].map((r): [string, string, number] => [
    `--coac-ranking-${r}-text`,
    `--coac-ranking-${r}-bg`,
    4.5,
  ]),
];

describe.each(["dark", "high-contrast"] as const)("contraste de coac-tokens.css en modo %s", (mode) => {
  const tokens = tokensOf(mode);

  it.each(pairs)("%s sobre %s ≥ %s:1", (foreground, background, minimum) => {
    expect(tokens[foreground], `falta ${foreground}`).toBeDefined();
    expect(tokens[background], `falta ${background}`).toBeDefined();
    expect(contrast(tokens[foreground], tokens[background])).toBeGreaterThanOrEqual(minimum);
  });
});
