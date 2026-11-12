// Cabecera de la app anterior (`App.tsx`, `vite --mode anterior`). La app publicada
// (VariantE) no la usa: el build la prerenderiza entera (ver vite-plugin-seo.ts).
interface SiteHeaderProps {
  year: number;
  phaseTitle: string;
}

export function SiteHeader({ year, phaseTitle }: SiteHeaderProps) {
  return (
    <header id="siteHeader" className="coac-site-header">
      <hgroup className="coac-site-header__inner">
        <h1 className="coac-site-header__title">
          ¿Quién canta hoy en el COAC {year}? <br />{" "}
          <strong className="coac-site-header__phase">{phaseTitle}</strong>
        </h1>
      </hgroup>
    </header>
  );
}
