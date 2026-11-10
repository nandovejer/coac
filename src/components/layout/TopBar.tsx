import type { ReactNode } from "react";
import { useScrolledPast } from "../../hooks/useScrolledPast";
import { SearchIcon } from "../ui/icons";
import "./TopBar.css";

interface TopBarProps {
  year: number;
  phaseTitle: string;
  /** Debajo, a todo el ancho: la marquesina con la cuenta atrás. */
  children?: ReactNode;
}

/**
 * Barra fija superior para móvil y tablet con título, subtítulo (la fase) y
 * botón de buscar y, debajo, la marquesina de la cuenta atrás. Oculta mientras se ve el hero (que ya dice todo eso);
 * aparece al pasarlo. En escritorio el panel lateral ya es fijo.
 */
export function TopBar({ year, phaseTitle, children }: TopBarProps) {
  const visible = useScrolledPast("siteHeader");

  return (
    <div className="coac-topbar" data-visible={visible || undefined}>
      <div className="coac-topbar__row">
        <a className="coac-topbar__brand" href="#siteHeader">
          <span className="coac-topbar__title">¿Quién canta hoy en el COAC {year}?</span>
          <span className="coac-topbar__phase">{phaseTitle}</span>
        </a>
        <a className="coac-topbar__search" href="#searchAuthor">
          <SearchIcon />
          <span className="coac-sr-only">Abrir el buscador</span>
        </a>
      </div>
      {children}
    </div>
  );
}
