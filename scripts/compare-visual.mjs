// Comparativas antes | después | diferencias de los tests visuales.
// Ejecuta los tests de capturas (que fallan si algo cambió) y, por cada fallo,
// junta la captura esperada, la actual y el diff en una sola imagen en
// tests/visual/compare/ (carpeta sin versionar) para revisarla a ojo.
//   pnpm run test:visual:compare            todos los escenarios
//   pnpm run test:visual:compare movil      solo los que contengan "movil"
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const filter = process.argv[2] ?? "";
const results = "test-results";
const out = "tests/visual/compare";

rmSync(results, { recursive: true, force: true });
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

spawnSync("pnpm", ["exec", "playwright", "test", "--reporter=null"], {
  stdio: "inherit",
});

const png = (path) => `data:image/png;base64,${readFileSync(path).toString("base64")}`;
const browser = await chromium.launch();
let count = 0;

for (const dir of readdirSync(results)) {
  if (!dir.includes(filter)) continue;
  const files = readdirSync(join(results, dir));
  const find = (suffix) => files.find((f) => f.endsWith(suffix));
  const [expected, actual, diff] = ["-expected.png", "-actual.png", "-diff.png"].map(find);
  if (!expected || !actual) continue;

  const cells = [
    ["antes", expected],
    ["después", actual],
    ["diferencias", diff],
  ]
    .filter(([, file]) => file)
    .map(
      ([title, file]) =>
        `<figure><figcaption>${title}</figcaption><img src="${png(join(results, dir, file))}"></figure>`,
    )
    .join("");

  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.setContent(
    `<style>body{margin:0;padding:12px;background:#888;font:600 14px sans-serif;display:flex;gap:12px;align-items:flex-start}
     figure{margin:0}figcaption{color:#fff;padding:4px 0}img{display:block;border:1px solid #000}</style>${cells}`,
  );
  await page.screenshot({ path: join(out, `${dir.replace(/^(schedule|modes)-/, "")}.png`), fullPage: true });
  await page.close();
  count += 1;
}

await browser.close();
console.log(count === 0 ? "Sin diferencias." : `${count} comparativas en ${out}/`);
