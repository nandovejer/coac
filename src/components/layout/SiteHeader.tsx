// Su CSS (SiteHeader.css) se importa desde App.tsx: vite-plugin-seo.ts renderiza
// este componente en el build y esbuild no puede cargar CSS al leer vite.config.ts.
interface SiteHeaderProps {
  year: number;
  phaseTitle: string;
  /** "sidebar": dentro del panel lateral de la app. El HTML estático usa "page". */
  variant?: "page" | "sidebar";
}

export function SiteHeader({ year, phaseTitle, variant = "page" }: SiteHeaderProps) {
  const className = variant === "sidebar" ? "coac-site-header coac-site-header--sidebar" : "coac-site-header";

  return (
    <header id="siteHeader" className={className}>
      <hgroup className="coac-site-header__inner">
        <h1 className="coac-site-header__title">
          ¿Quién canta hoy en el COAC {year}? <br />{" "}
          <strong className="coac-site-header__phase">{phaseTitle}</strong>
        </h1>
      </hgroup>
    </header>
  );
}
