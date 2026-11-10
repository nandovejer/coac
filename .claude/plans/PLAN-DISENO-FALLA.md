# Plan de diseño: paleta e inspiración del Gran Teatro Falla

Referencia visual de la identidad de la web. **Aplicada el 2026-11-10** (ver §9):
los dos modos de color (claro y oscuro) usan la paleta; el alto contraste no cambia.

- Fotos de referencia (copias ligeras, no se publican): `inspiracion-falla/`
  (`fachada.jpg`, `interior-telon.jpg`, `puerta-monograma.jpg`).
- Lámina de la paleta: `inspiracion-falla/paleta-falla.png`.

## 0. Principio rector (manda sobre todo lo demás)

La web se usa sobre todo **en el móvil**, a menudo de pie, en la calle o en el
propio Falla, con prisa y mala cobertura. Tiene que ser:

- **Intuitiva:** se entiende sin explicaciones. La pregunta es una sola, «¿quién
  canta hoy y a qué hora?», y la respuesta tiene que estar a la vista.
- **Rápida y ligera:** primero el texto; nada que haya que descargar para
  entender la página.
- **Concreta:** cada elemento responde a una necesidad. Sin decoración que
  compita con el horario.
- **Acorde con los Core Web Vitals** (ver §6).

La inspiración del Falla entra como **color y geometría en CSS**, nunca como
fotos, texturas ni fuentes pesadas. Si una idea de este plan choca con este
principio, gana el principio.

## 1. Impresiones visuales

**Fachada (de día).** Neomudéjar de ladrillo salmón y piedra ostionera en bandas
horizontales que alternan: un ritmo bicolor muy reconocible. Arcos de medio
punto y de herradura con dovelas que alternan ladrillo, piedra y ocre. Toda la
carpintería es azul cobalto saturado, que choca con el ladrillo cálido y da la
nota fría. Las ventanas tienen un radio de rueda: un círculo central con
travesaños que salen como rayos. Arriba, el rótulo «GRAN TEATRO FALLA» en
capitales con serifa sobre una franja de azulejo blanco, y un friso de
ladrillo con relieves geométricos.

**Puerta (detalle).** El azul, visto de cerca, es más bien un azul pizarra
desgastado por el sol. El zócalo es granate oscuro con el monograma «TGF» en
oro viejo: la combinación granate y oro es la firma institucional del teatro.

**Sala (de noche).** Oscuridad cálida, casi negra con un fondo rojizo. Telón de
terciopelo rojo vino con el monograma proyectado. Palcos de herradura con
barandillas doradas y paneles ocres, y luz de candil cálida en los apliques.
Abajo, la mesa del jurado con sus pantallas: el COAC en estado puro.

**Lectura de conjunto.** Dos mundos que encajan con los modos de color que ya
tiene la web:

| Modo | Mundo | Sensación |
|---|---|---|
| Claro | **Fachada de día**: cal, ladrillo y cobalto | Luminoso, cálido y gaditano; la calle |
| Oscuro | **Sala de noche**: platea, terciopelo y oro | Teatral, íntimo; el momento de la actuación |
| Alto contraste | Sin cambios (negro, blanco y foco cobalto) | La funcionalidad manda |

## 2. Paleta

Cada color sale de una zona concreta de las fotos (muestreada con ImageMagick,
no a ojo). Las fotos están algo subexpuestas, así que el valor final sube un
poco la luz o la saturación respecto a la muestra para reflejar el color real.

### Fachada · día (modo claro)

| Nombre | Hex | Muestra en la foto | Rol propuesto |
|---|---|---|---|
| Cal | `#F3ECE2` | Piedra encalada `#DABBA9` / `#CAC6B9`, aclarada | Fondo de página |
| Piedra | `#E2D3C3` | Bandas de piedra `#DABBA9` / `#CCB7AB` | Superficies secundarias, separadores |
| Salmón | `#E3AB93` | Ladrillo claro del friso `#E3AB93` | Decorativo (bandas finas) |
| Ladrillo | `#C47A5E` | Ladrillo medio `#C98E72` / `#CC8D72` | Decorativo (no para texto: 2,9:1) |
| Terracota | `#8A4632` | Ladrillo oscuro `#A95E48`, oscurecido para texto | Acento cálido con texto (6:1 sobre cal) |
| Ocre dovela | `#B98F5C` | Dovelas `#A48B70` / `#B59D87` | Solo decorativo (2,5:1) |
| Cobalto | `#2D51A5` | Ventanas `#2D51A5` | Acento principal: enlaces, botón «Ver el directo» |
| Pizarra | `#4A6680` | Puerta de cerca `#56738B` / `#3B576F` | Texto secundario frío, bordes |
| Marino | `#192C60` | Puertas en sombra `#192C60` | Panel lateral y cabecera (sustituye al gris `#1f2937`) |
| Tinta | `#2E1F24` | Letras del rótulo `#473036`, oscurecidas | Texto principal (cálido, no negro puro) |

### Sala · noche (modo oscuro)

| Nombre | Hex | Muestra en la foto | Rol propuesto |
|---|---|---|---|
| Platea | `#160C10` | Oscuridad de la sala `#140A0D` | Fondo de página |
| Telón | `#3B0A14` | Telón en sombra `#3B0A14` | Superficies (tarjetas, panel) |
| Terciopelo | `#6E0F22` | Telón iluminado `#570A18`, aclarado | Superficie destacada, cabecera de tabla |
| Granate | `#5B1F2E` | Zócalo de la puerta, ajustado | Superficie alternativa |
| Bronce | `#623111` | Sombras doradas `#623111` | Decorativo |
| Oro viejo | `#8F6E3C` | Monograma `#9B8361` | Decorativo; texto grande sobre cal (4:1) |
| Oro | `#C9A46A` | Barandillas `#CBA77C` / `#AA7646` | Acento: títulos y enlaces (8:1 sobre platea) |
| Candil | `#F4D9A6` | Luz de los apliques | Texto principal cálido (14:1 sobre platea) |

### Contraste comprobado (WCAG)

| Combinación | Contraste | Uso permitido |
|---|---|---|
| Tinta sobre cal | 13,4:1 | Texto |
| Tinta sobre piedra | 10,7:1 | Texto |
| Cobalto sobre cal | 6,3:1 | Texto y enlaces |
| Cobalto sobre piedra | 5,1:1 | Texto |
| Marino sobre cal | 11,4:1 | Texto |
| Terracota sobre cal | 6,0:1 | Texto |
| Pizarra sobre cal | 5,1:1 | Texto |
| Oro viejo sobre cal | 4,0:1 | Solo texto grande / interfaz |
| Ladrillo / ocre sobre cal | 2,9 / 2,5:1 | **Solo decorativo** |
| Cal sobre marino | 11,4:1 | Texto (panel lateral claro) |
| Cal sobre cobalto | 6,3:1 | Texto de botón |
| Cal sobre terciopelo | 10,2:1 | Texto |
| Oro sobre platea / telón / terciopelo | 8,2 / 7,3 / 5,1:1 | Texto |
| Oro sobre marino | 5,7:1 | Texto |
| Candil sobre platea / terciopelo | 14,0 / 8,7:1 | Texto |

Al aplicarla, cada pareja que se use va a `src/styles/coac-tokens.test.ts`, como
el resto de los tokens.

## 3. Inspiraciones aplicables (ligeras, solo CSS)

Ordenadas de más a menos impacto por coste:

1. **Los dos mundos como modos de color.** Solo cambian los valores de los tokens
   (`coac-tokens.css` y `theme-coac.css`), sin tocar componentes. Coste en peso:
   cero.
   - Claro: fondo cal, texto tinta, panel lateral marino, acento cobalto.
   - Oscuro: fondo platea, tarjetas telón, cabecera de tabla terciopelo,
     acento oro, texto candil.
2. **Banda bicolor de la fachada** como separador fino (por ejemplo, bajo la
   cabecera o entre secciones), hecha con un borde discontinuo de color salmón
   sobre fondo piedra (`border-block-start: 4px dashed`). Salen rayas sin
   degradados (la regla de no usar degradados se mantiene) y sin imágenes.
3. **Arco de medio punto** en el bloque de fecha de cada sesión («08 ENE»), con
   las esquinas superiores redondeadas (`border-radius: 999px 999px 0 0`). Evoca
   las ventanas del Falla con una línea de CSS.
4. **Rótulo de azulejo:** las etiquetas de sección («SESIÓN DE HOY») ya van en
   mayúsculas espaciadas. Se pueden enmarcar con un filete fino, como el rótulo
   de la fachada.
5. **Radio de rueda** de las ventanas como marca propia de la web (favicon o
   icono pequeño) en un SVG en línea de menos de 1 KB. **No usar el monograma
   «TGF»**: es la identidad del teatro y la web no es oficial; tomarlo prestado
   confundiría.
6. **Serifa en las fechas de sesión**, como en el rótulo, con la pila de sistema
   (`ui-serif, Georgia, "Times New Roman", serif`): cero bytes descargados. Una
   fuente web solo si se justifica: WOFF2 recortado de menos de 20 KB, con
   `font-display: swap` y métricas ajustadas (`size-adjust`) para que no mueva
   nada al cargar.

Descartado por el principio rector: fotos del teatro en la página, texturas de
ladrillo, la animación de telón abriéndose (pesa, retrasa la respuesta y no
aporta nada al horario) y los adornos que ocupen la primera pantalla del móvil.

## 4. Convivencia con el semáforo y el «EN DIRECTO»

El semáforo es funcional y tiene prioridad sobre la estética:

- **Oro y ocre se parecen al amarillo de «Recomendada».** El oro queda para
  títulos, enlaces y decoración, nunca como fondo de fila. El amarillo del
  semáforo sigue siendo puro (`#facc15`).
- **Terciopelo y granate se parecen al rojo de «EN DIRECTO».** El directo sigue
  en su rojo de emisión, más vivo (`#b91c1c`), y siempre en pastilla con icono.
  En modo oscuro hay que comprobar que la pastilla se distingue sobre el
  terciopelo; si no, se le da un filete de color candil.
- El **verde** del semáforo no existe en el Falla y no hace falta: es la luz que
  más destaca, como debe ser.

## 5. Propuesta de correspondencia con los tokens actuales (sin aplicar)

| Token | Claro (fachada) | Oscuro (sala) |
|---|---|---|
| `--luz-surface-page` | Cal `#F3ECE2` | Platea `#160C10` |
| `--luz-surface` | Blanco o piedra muy clara | Telón `#3B0A14` |
| `--luz-text-primary` | Tinta `#2E1F24` | Candil `#F4D9A6` |
| `--coac-header-bg` / `--coac-nav-bg` | Marino `#192C60` | Platea `#160C10` |
| `--coac-panel-bg` | Cobalto oscurecido | Telón `#3B0A14` |
| `--coac-cta-bg` | Cobalto `#2D51A5` | Oro `#C9A46A` (texto platea) |
| `--coac-on-header-accent` | Salmón o candil | Oro `#C9A46A` |
| `--coac-table-head-bg` | Marino `#192C60` | Terciopelo `#6E0F22` |
| `--coac-accent` / `--coac-link` | Cobalto `#2D51A5` | Oro `#C9A46A` |
| `--coac-border` | Piedra `#E2D3C3` | Granate `#5B1F2E` |

El alto contraste no cambia. Al aplicarlo hay que revisar las modalidades
(azul, violeta, rosa y pizarra), para que no se confundan con cobalto,
terciopelo ni pizarra.

## 6. Límites de rendimiento (Core Web Vitals, en móvil)

Lo que no se puede romper al aplicar cualquier idea de este plan:

- **LCP (≤ 2,5 s):** el contenido principal es texto, con el CSS en línea en
  `index.html` y el HTML estático del SEO. Ninguna imagen ni fuente puede pasar
  a ser el elemento LCP.
- **CLS (≤ 0,1, objetivo 0):** nada que aparezca o cambie de tamaño al cargar.
  Lo decorativo, con tamaño fijo; las fuentes, con métricas ajustadas. La
  cuenta atrás ya reserva el ancho de cifra.
- **INP (≤ 200 ms):** filtros, búsqueda y flechas trabajan en local y solo
  repintan lo que cambia (los `memo` de las sesiones se mantienen). Sin
  animaciones que bloqueen.
- **Peso:** hoy el JS de la app son unos 14 KB gzip (más React, 45 KB gzip y
  en caché aparte). Este plan no debería añadir más de 2 KB entre CSS y SVG.
- **Cómo medir:** Lighthouse en modo móvil sobre `pnpm run build && pnpm run
  preview`, antes y después, y anotar aquí los números.

## 7. Ideas pendientes (de la web de referencia `coac-preliminares-2027.html`)

Encajan con el principio rector y no dependen de la paleta:

1. Días en **rejilla de 7×2 en móvil** en vez de fila con flechas: los 14 días a
   la vista, un toque y listo.
2. **Barra de fases** (preliminares, cuartos, semifinales y final, con fechas y
   la actual marcada). Las fechas están en el comentario de `season.ts`; habría
   que pasarlas a datos.
3. **Número de orden de actuación** (01, 02…) junto a la hora: el orden es
   oficial y la hora, estimada.
4. **Filtro por modalidad** y **búsqueda por nombre de agrupación**, además de
   por autor.
5. **Mensaje cuando la búsqueda no encuentra nada.**
6. **Fuentes de los datos** en el pie.

## 8. Decisiones abiertas

- ¿Se aplican los dos mundos a la vez o primero uno (por ejemplo, el oscuro
  como «sala»)?
- ¿Serifa en las fechas, o se mantiene todo en sans?
- ¿El panel lateral claro pasa del gris actual al marino de las puertas?
- ¿Marca propia (radio de rueda) para el favicon y la cabecera?

## 9. Qué se aplicó (2026-11-10)

- **Los dos mundos como modos de color** (§3.1): solo cambian los valores de
  `theme-coac.css` y `coac-tokens.css`; ningún componente se tocó.
  - Claro: fondo cal, tarjetas blancas, texto tinta, panel y cabecera de tabla
    marino, acento cobalto, acento sobre el panel salmón, pie en piedra.
  - Oscuro: fondo platea, tarjetas telón, cabecera de tabla terciopelo, acento
    oro, texto candil, botón «Ver el directo» en oro con texto platea; las filas
    «standar» son azul noche (`#111b3f`, del marino de las puertas): un marrón se confundía con el telón y el rojo se leería como «malo».
  - `--luz-surface-strong` del claro es `#f0e8dc` (más claro que piedra) para que
    los colores de estado sigan cumpliendo 4,5:1.
- **Banda bicolor** (§3.2) en las etiquetas de sección, con los tokens
  `--coac-band-base` y `--coac-band-accent` (sólida en alto contraste).
- `theme-color` y `site.webmanifest` pasan a marino y cal.
- Se quitó del test el par `cta-text` sobre `header-bg`: ya no tenía sentido con
  el botón dorado del oscuro.
- Verificado: `check:contrast`, `lint:luz`, tests unitarios y `test:visual` (axe
  sin excepciones en los tres modos).

**No aplicado** (siguen abiertos en §8): arco de medio punto en la fecha (hoy no
hay bloque de fecha), filete en las etiquetas, serifa en las fechas, marca de la
rueda para el favicon y las ideas de §7. No se midió Lighthouse: el cambio es
solo de valores de color (la banda añade unos 100 bytes de CSS).
