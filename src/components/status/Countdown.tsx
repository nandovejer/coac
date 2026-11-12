import { useEffect, useRef, useState } from "react";
import { usePrerender } from "../../app/prerenderContext";
import { pad2, useRemaining } from "../../app/useProgramme";
import "./Countdown.css";

/**
 * Una cifra de la cuenta atrás. Al cambiar, la nueva entra desde abajo y la
 * anterior sale por arriba, recortadas por la ventana de la cifra: nunca hay
 * opacidad intermedia, así que el texto conserva su contraste en cada fotograma.
 * La primera vez no se anima, y sin «reducir movimiento» tampoco (lo decide el CSS).
 */
function Roll({ value }: { value: number }) {
  const [state, setState] = useState({ value, previous: null as number | null, count: 0 });
  if (state.value !== value) {
    setState({ value, previous: state.value, count: state.count + 1 });
  }

  // La cifra vieja se retira con un temporizador, nunca con `animationend`
  useEffect(() => {
    if (state.previous === null) return;
    const timer = setTimeout(() => setState((s) => ({ ...s, previous: null })), 470);
    return () => clearTimeout(timer);
  }, [state.count, state.previous]);

  return (
    <strong className="coac-app__roll" data-rolling={state.previous !== null || undefined}>
      <span key={state.count} className="coac-app__roll-now">
        {pad2(state.value)}
      </span>
      {state.previous !== null && (
        <span className="coac-app__roll-was" aria-hidden="true">
          {pad2(state.previous)}
        </span>
      )}
    </strong>
  );
}

/**
 * Cuenta atrás hasta `target`. Vive en su propio componente: el segundo a
 * segundo solo vuelve a pintar estas cifras, no el programa entero. Los
 * segundos cambian sin animar (un movimiento por segundo en la tarjeta más
 * visible cansaría); las cifras van `aria-hidden` y el texto accesible solo
 * cambia por minutos.
 */
/**
 * Las cifras cambian por segundos: el prerender pone «--» en su sitio. El número
 * oculto da el ancho exacto de dos cifras, así que al montar nada se mueve.
 */
function Pending({ label }: { label: string }) {
  return (
    <span className="coac-app__digit">
      <strong className="coac-app__pending">
        <span className="coac-app__pending-width">00</span>
        <span className="coac-app__pending-mark">--</span>
      </strong>
      {label}
    </span>
  );
}

export function Countdown({ target }: { target: Date }) {
  const prerender = usePrerender();
  const remaining = useRemaining(target);
  const anchor = useRef<HTMLDivElement>(null);
  // La fachada de la tarjeta sube un poco en la última hora (--coac-app-curtain, de 0 a 1).
  // Cambia por minutos y sin transición: no hay movimiento continuo.
  const minutes = remaining ? remaining.days * 1440 + remaining.hours * 60 + remaining.minutes : null;
  useEffect(() => {
    const card = anchor.current?.closest<HTMLElement>(".coac-app__status");
    if (!card || minutes === null) return;
    card.style.setProperty("--coac-app-curtain", String(minutes >= 60 ? 0 : 1 - minutes / 60));
    return () => {
      card.style.removeProperty("--coac-app-curtain");
    };
  }, [minutes]);
  if (prerender) {
    return (
      <div className="coac-app__countdown" data-nosnippet>
        <div className="coac-app__digits" aria-hidden="true">
          <Pending label="días" />
          <Pending label="horas" />
          <Pending label="min" />
          <Pending label="seg" />
        </div>
      </div>
    );
  }
  if (!remaining) return null;
  return (
    <div ref={anchor} className="coac-app__countdown" data-nosnippet>
      <div className="coac-app__digits" aria-hidden="true">
        <span className="coac-app__digit">
          <Roll value={remaining.days} />
          días
        </span>
        <span className="coac-app__digit">
          <Roll value={remaining.hours} />
          horas
        </span>
        <span className="coac-app__digit">
          <Roll value={remaining.minutes} />
          min
        </span>
        <span className="coac-app__digit">
          <strong>{pad2(remaining.seconds)}</strong>
          seg
        </span>
      </div>
      <p className="coac-sr-only">
        Faltan {remaining.days} días, {remaining.hours} horas y {remaining.minutes} minutos.
      </p>
    </div>
  );
}
