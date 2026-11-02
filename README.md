# ¿Quién canta hoy en el COAC?

Web que muestra qué agrupaciones cantan en cada sesión del COAC (Concurso
Oficial de Agrupaciones Carnavalescas de Cádiz), con horario estimado,
buscador de autores y enlace al directo.

## Desarrollo

```bash
pnpm install
pnpm run dev          # servidor de desarrollo
pnpm run lint         # ESLint
pnpm run format       # Prettier (format:check solo comprueba)
pnpm run typecheck    # tsc
pnpm run test         # tests unitarios (Vitest)
pnpm run test:visual  # capturas y comportamiento (Playwright, local)
pnpm run build        # tsc + build de producción a dist/
pnpm run deploy       # relanza el deploy de main en GitHub Actions (necesita gh)
```

`test:visual` necesita Chromium (`pnpm exec playwright install chromium`).
Compara contra capturas de Linux: si cambias el aspecto a propósito, regénera
con `pnpm run test:visual:update`.

## Actualizar a una nueva fase (3 pasos)

1. Crea `src/data/COAC_<año>_<FASE>.json` con el mismo formato que el actual
   (claves `dd/mm/yyyy` → array de agrupaciones). `pnpm run test` lo valida.
2. Edita `src/config/season.ts`: cambia el import del JSON y ajusta
   `phaseTitle`, `previousYear` (si toca) y las horas de sesión si cambian.
3. Haz push a `main`: GitHub Actions comprueba y publica en GitHub Pages
   (`pnpm run deploy` solo lo vuelve a lanzar, no sube nada desde tu máquina).

Las fechas de cada sesión **no** se declaran a mano en ningún sitio: se
derivan directamente de las claves del JSON.

> GitHub Pages debe estar configurado con la fuente **GitHub Actions**
> (Settings → Pages → Build and deployment).

Más contexto del proyecto en [AGENTS.md](AGENTS.md).
