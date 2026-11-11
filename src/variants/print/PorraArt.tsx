import { useId } from "react";
import { FallaLogo } from "../../components/ui/FallaLogo";
import type { Modalidad } from "../../types";
import { CONFETTI, ICON_SHAPES, MASK, type Shape } from "./porraShapes";

/**
 * Dibujos de la hoja de la porra, en SVG propio y de una sola tinta
 * (`currentColor`): un icono por modalidad, el antifaz con plumas de la
 * cabecera, el sello y el confeti. Todos son decorativos (`aria-hidden`).
 */

function renderShape(shape: Shape, key: number) {
  if (shape.kind === "path") return <path key={key} d={shape.d} />;
  if (shape.kind === "ellipse")
    return <ellipse key={key} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} />;
  return <circle key={key} cx={shape.cx} cy={shape.cy} r={shape.r} />;
}

export function ModalidadIcon({ modalidad }: { modalidad: Modalidad }) {
  return (
    <svg className="coac-porra__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {ICON_SHAPES[modalidad].map(renderShape)}
    </svg>
  );
}

/** Antifaz con dos plumas, a la izquierda del titular. */
export function MaskArt() {
  return (
    <svg className="coac-porra__mask" viewBox="0 0 120 110" aria-hidden="true" focusable="false">
      {MASK.feathers.map(({ tone, d }) => (
        <path key={tone} className="coac-porra__feather" data-tone={tone} d={d} />
      ))}
      <path className="coac-porra__mask-face" d={MASK.face} />
      {MASK.eyes.map((eye) => (
        <ellipse key={eye.cx} className="coac-porra__mask-eye" {...eye} />
      ))}
      <circle className="coac-porra__mask-gem" {...MASK.gem} />
    </svg>
  );
}

/** Sello redondo «¡Que suene el Carnaval!» con la fachada del Falla en medio. */
export function Stamp() {
  const id = useId();
  return (
    <div className="coac-porra__stamp" aria-hidden="true">
      <svg className="coac-porra__stamp-ring" viewBox="0 0 100 100" focusable="false">
        <circle cx="50" cy="50" r="47" />
        <circle cx="50" cy="50" r="33" />
        <path id={id} d="M50 10a40 40 0 1 1 0 80a40 40 0 1 1 0-80" fill="none" stroke="none" />
        <text>
          <textPath href={`#${id}`} textLength="246" lengthAdjust="spacing">
            ¡QUE SUENE EL CARNAVAL! · COAC ·
          </textPath>
        </text>
      </svg>
      <FallaLogo className="coac-porra__stamp-falla" />
    </div>
  );
}

export function Confetti() {
  return (
    <div className="coac-porra__confetti" aria-hidden="true">
      {CONFETTI.map(({ x, y, r, c }, index) => (
        <span
          key={index}
          data-tone={c}
          style={{ insetInlineStart: `${x}%`, insetBlockStart: `${y}%`, rotate: `${r}deg` }}
        />
      ))}
    </div>
  );
}
