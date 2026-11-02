---
name: nueva-fase
description: Pasar la web a una nueva fase o temporada del COAC (preliminares, cuartos, semifinales, final, o un año nuevo). Úsalo cuando haya un listado nuevo de agrupaciones o haya que actualizar season.ts.
---

# Cambiar de fase

Solo se tocan el JSON de la fase y `src/config/season.ts`. No cambies
componentes ni el formato de los datos.

1. **Datos**: crea `src/data/COAC_<año>_<FASE>.json` (`PRE`, `CUARTOS`, `SEMI`,
   `FINAL`) con el mismo formato que los existentes. Las claves son fechas
   `dd/mm/yyyy` y las agrupaciones van en orden de actuación. Cada agrupación
   lleva la clave del año anterior (`"2025"` en la temporada 2026).
2. **Validar**: `pnpm run test`. Corrige lo que diga `data.test.ts` (modalidad,
   ranking, campos vacíos, clave del año anterior…). No "arregles" el contenido
   de los datos por tu cuenta: avisa de lo raro.
3. **Config**: en `src/config/season.ts` cambia el import del JSON,
   `phaseTitle`, `year`/`previousYear` si es temporada nueva, y revisa
   `sessionStartTime`, `sessionEndTime` y `minutesPerGroup` (la final dura más
   que una sesión normal).
4. **Comprobar**: `pnpm run lint && pnpm run typecheck && pnpm run test &&
   pnpm run build`. Abre `dist/index.html` y mira que el `<title>` y el JSON-LD
   llevan la fase y las fechas nuevas. `pnpm run test:visual` debe seguir
   pasando (usa su propio fixture).
5. **Publicar**: commit y push a `main` (con permiso del usuario). El deploy lo
   hace GitHub Actions; no hay deploy manual.
6. Al empezar una temporada nueva, pregunta si hay que archivar los JSON de la
   anterior en una rama (`<año>_COAC`) y borrarlos de `main`.
