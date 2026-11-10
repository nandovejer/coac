import { useState } from "react";
import "./RollingNumber.css";

/**
 * Una cifra. Al cambiar, la anterior sube y se desvanece mientras la nueva
 * entra desde abajo (la animación está en el CSS y se desactiva con
 * `prefers-reduced-motion`).
 */
function RollingDigit({ value }: { value: string }) {
  const [state, setState] = useState<{ current: string; previous: string | null }>({
    current: value,
    previous: null,
  });
  // Ajuste de estado durante el render: recuerda la cifra que acaba de salir.
  if (state.current !== value) setState({ current: value, previous: state.current });

  return (
    <span className="coac-digit">
      <span
        key={state.current}
        className="coac-digit__current"
        data-rolling={state.previous !== null || undefined}
      >
        {state.current}
      </span>
      {state.previous !== null && (
        <span key={`${state.previous}>${state.current}`} className="coac-digit__previous">
          {state.previous}
        </span>
      )}
    </span>
  );
}

/** Un número de al menos dos cifras (5 → 05) cuyas cifras ruedan al cambiar. */
export function RollingNumber({ value }: { value: number }) {
  const digits = String(value).padStart(2, "0").split("");
  return (
    <>
      {digits.map((digit, position) => (
        <RollingDigit key={digits.length - position} value={digit} />
      ))}
    </>
  );
}
