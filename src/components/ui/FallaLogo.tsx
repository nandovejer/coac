/**
 * Logo: la fachada del Gran Teatro Falla en una sola tinta (`currentColor`),
 * así sirve en los tres modos de color. Torres con pináculos a los lados,
 * cuerpo central con el cartel del nombre, tres ventanales de herradura
 * neomudéjar, la imposta y tres puertas en arco. Los huecos se recortan
 * (evenodd): se ve el fondo. Decorativo: el nombre lo da el texto de al lado.
 */
const FACADE = [
  // Silueta: torres laterales con pináculo y cuerpo central con dos pináculos
  "M3 45V17h2v-4h1.5v-2h1v2H9v4h3V11h1.5V7h1V5.5h1V7h1v4h15V7h1V5.5h1V7h1v4H36v6h3v-4h1.5v-2h1v2H43v4h2v28Z",
  // Cartel «Gran Teatro Falla»
  "M17.5 13.5h13v3h-13Z",
  // Tres ventanales de herradura (el arco pasa de media circunferencia)
  "M16 32v-7a2.5 2.5 0 1 1 4 0v7Z",
  "M22 32v-7a2.5 2.5 0 1 1 4 0v7Z",
  "M28 32v-7a2.5 2.5 0 1 1 4 0v7Z",
  // Ventanas de las torres
  "M6.5 30v-5a1.5 1.5 0 1 1 3 0v5Z",
  "M38.5 30v-5a1.5 1.5 0 1 1 3 0v5Z",
  // Imposta entre el piso noble y la planta baja
  "M13.5 34.5h21v1h-21Z",
  // Tres puertas
  "M16 45v-6a2 2 0 0 1 4 0v6Z",
  "M22 45v-6a2 2 0 0 1 4 0v6Z",
  "M28 45v-6a2 2 0 0 1 4 0v6Z",
].join("");

export function FallaLogo({ className }: { className?: string }) {
  return (
    // El viewBox se ciñe al dibujo (x 3–45, y 5,5–45) y lo centra: así el logo
    // queda centrado ópticamente junto al texto, sin aire de más arriba.
    <svg className={className} viewBox="3 4.25 42 42" aria-hidden="true" focusable="false">
      <path d={FACADE} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
