/**
 * Logo: la fachada del Gran Teatro Falla en una sola tinta (`currentColor`),
 * así sirve en los tres modos de color. Torres con pináculos a los lados,
 * cuerpo central con el cartel del nombre, tres ventanales de herradura
 * neomudéjar, la imposta y tres puertas en arco. Los huecos se recortan
 * (evenodd): se ve el fondo. Decorativo: el nombre lo da el texto de al lado.
 */
import { FACADE, FACADE_VIEWBOX } from "./facade";

export function FallaLogo({ className }: { className?: string }) {
  return (
    // El viewBox se ciñe al dibujo (x 3–45, y 5,5–45) y lo centra: así el logo
    // queda centrado ópticamente junto al texto, sin aire de más arriba.
    <svg className={className} viewBox={FACADE_VIEWBOX.join(" ")} aria-hidden="true" focusable="false">
      <path d={FACADE} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
