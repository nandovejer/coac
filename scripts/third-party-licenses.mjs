// Genera `public/THIRD-PARTY-LICENSES.txt` con el aviso y el texto de licencia de
// cada dependencia de producción (las licencias MIT, Apache-2.0, MPL-2.0 o Zlib
// exigen conservarlos al redistribuir). Se ejecuta antes de `vite build` (y vite lo copia a dist/); el archivo se versiona para que
// el servidor de desarrollo también lo sirva.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "public/THIRD-PARTY-LICENSES.txt";

const raw = execFileSync("pnpm", ["licenses", "list", "--prod", "--json"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const byLicense = JSON.parse(raw);

const packages = Object.values(byLicense)
  .flat()
  // Solo tipos de TypeScript: no se redistribuyen
  .filter((pkg) => !pkg.name.startsWith("@types/"))
  .sort((a, b) => a.name.localeCompare(b.name));

function licenseText(dir) {
  const file = readdirSync(dir).find((name) => /^(licen[cs]e|copying|notice)(\..*)?$/i.test(name));
  return file ? readFileSync(join(dir, file), "utf8").trim() : null;
}

const parts = [
  "Licencias de terceros de «¿Quién canta hoy en el COAC?» (coac.com.es)",
  "",
  "Esta web incluye las dependencias siguientes. Cada una se distribuye con su",
  "propia licencia, que se reproduce más abajo. El código propio de la web es MIT",
  "(ver LICENSE en https://github.com/nandovejer/coac).",
  "",
  "Resumen:",
  ...packages.map((pkg) => `  - ${pkg.name} ${pkg.versions.join(", ")} — ${pkg.license}`),
];

const missing = [];
for (const pkg of packages) {
  const dir = pkg.paths.find((path) => existsSync(path));
  const text = dir ? licenseText(dir) : null;
  if (!text) missing.push(pkg.name);
  parts.push(
    "",
    "=".repeat(78),
    `${pkg.name} ${pkg.versions.join(", ")} — ${pkg.license}`,
    pkg.homepage ?? "",
    "=".repeat(78),
    "",
    text ?? `(El paquete no incluye un archivo de licencia; licencia declarada: ${pkg.license}.)`,
  );
}

writeFileSync(OUT, parts.join("\n") + "\n");
console.log(
  `${OUT}: ${packages.length} paquetes${missing.length ? `; sin archivo de licencia: ${missing.join(", ")}` : ""}`,
);
