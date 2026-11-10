import type { ReactNode } from "react";
import "./Hero.css";

interface HeroProps {
  year: number;
  phaseTitle: string;
  /** Qué es la web, en una o dos frases. */
  description: string;
  /** Cuenta atrás (o lo que toque debajo de la descripción). */
  children?: ReactNode;
}

/**
 * Cabecera de la página, centrada: título (el h1), fase, descripción y la
 * cuenta atrás. Es el ancla `#siteHeader`. Solo texto y CSS: el LCP es
 * inmediato.
 */
export function Hero({ year, phaseTitle, description, children }: HeroProps) {
  return (
    <header id="siteHeader" className="coac-hero">
      <div className="coac-hero__inner">
        <div className="coac-hero__text">
          <h1 className="coac-hero__title">
            <span className="coac-hero__question">¿Quién canta hoy</span>{" "}
            <span className="coac-hero__where">en el COAC {year}?</span>
          </h1>
          <p className="coac-hero__phase">{phaseTitle}</p>
          <p className="coac-hero__description">{description}</p>
        </div>
        {children && <div className="coac-hero__aside">{children}</div>}
      </div>
    </header>
  );
}
