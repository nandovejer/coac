import { useId } from "react";
import { FallaLogo } from "../../components/ui/FallaLogo";
import type { Modalidad } from "../../types";

/**
 * Dibujos de la hoja de la porra, en SVG propio y de una sola tinta
 * (`currentColor`): un icono por modalidad, el antifaz con plumas de la
 * cabecera, el sello y el confeti. Todos son decorativos (`aria-hidden`).
 */

const ICONS: Record<Modalidad, JSX.Element> = {
  // Coro: chistera
  CORO: (
    <>
      <path d="M7.5 4.5h9v11h-9z" />
      <path d="M7.5 12.5h9" />
      <path d="M3 16.8c0 1.3 4 2.4 9 2.4s9-1.1 9-2.4-4-2.3-9-2.3-9 1-9 2.3z" />
    </>
  ),
  // Comparsa: lira
  COMPARSA: (
    <>
      <path d="M8 3.5C4.5 6.5 4.8 12.6 9 15.5M16 3.5c3.5 3 3.2 9.1-1 12" />
      <path d="M6.5 5h11M9 15.5h6M12 15.5v3.5M9 20.5h6" />
      <path d="M10.3 6v9M13.7 6v9" />
    </>
  ),
  // Chirigota: antifaz
  CHIRIGOTA: (
    <>
      <path d="M2.8 8.6c3-2 6.1-1.3 9.2.9 3.1-2.2 6.2-2.9 9.2-.9 0 5.2-2.8 7.4-5.2 7.4-1.9 0-3-1.7-4-3-1 1.3-2.1 3-4 3-2.4 0-5.2-2.2-5.2-7.4z" />
      <ellipse cx="7.8" cy="11" rx="2" ry="1.3" />
      <ellipse cx="16.2" cy="11" rx="2" ry="1.3" />
    </>
  ),
  // Cuarteto: abanico
  CUARTETO: (
    <>
      <path d="M12 20.5 3.6 8.2a10.5 10.5 0 0 1 16.8 0z" />
      <path d="M12 20.5 7.6 5.4M12 20.5V4.3M12 20.5l4.4-15.1" />
      <circle cx="12" cy="20" r="1" />
    </>
  ),
};

export function ModalidadIcon({ modalidad }: { modalidad: Modalidad }) {
  return (
    <svg className="coac-porra__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {ICONS[modalidad]}
    </svg>
  );
}

/** Antifaz con dos plumas, a la izquierda del titular. */
export function MaskArt() {
  return (
    <svg className="coac-porra__mask" viewBox="0 0 120 110" aria-hidden="true" focusable="false">
      <path className="coac-porra__feather" data-tone="1" d="M64 58C56 38 58 14 78 2c4 22-2 42-14 56z" />
      <path className="coac-porra__feather" data-tone="2" d="M60 60C46 46 38 24 50 4c10 18 14 38 10 56z" />
      <path className="coac-porra__feather" data-tone="3" d="M68 60C74 42 90 26 112 24c-8 20-24 32-44 36z" />
      <path
        className="coac-porra__mask-face"
        d="M8 66c14-10 30-7 46 3 16-10 32-13 46-3 0 24-13 35-24 35-9 0-15-8-22-14-7 6-13 14-22 14-11 0-24-11-24-35z"
      />
      <ellipse className="coac-porra__mask-eye" cx="33" cy="76" rx="10" ry="6.5" />
      <ellipse className="coac-porra__mask-eye" cx="75" cy="76" rx="10" ry="6.5" />
      <circle className="coac-porra__mask-gem" cx="54" cy="66" r="4" />
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

/** Confeti: tiras de colores sueltas por la cabecera. */
const CONFETTI = [
  { x: 3, y: 4, r: 24, c: 1 },
  { x: 13, y: 0, r: -30, c: 2 },
  { x: 20, y: 18, r: 60, c: 3 },
  { x: 22, y: 52, r: -12, c: 4 },
  { x: 76, y: 22, r: 40, c: 1 },
  { x: 77, y: 56, r: -50, c: 3 },
  { x: 84, y: 1, r: 18, c: 2 },
  { x: 96, y: 62, r: -24, c: 4 },
  { x: 1, y: 70, r: 70, c: 2 },
  { x: 12, y: 84, r: -40, c: 1 },
  { x: 88, y: 86, r: 28, c: 4 },
  { x: 97, y: 4, r: -66, c: 3 },
];

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
