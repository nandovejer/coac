// Su CSS (SiteHeader.css) se importa desde App.tsx: vite-plugin-seo.ts renderiza
// este componente en el build y esbuild no puede cargar CSS al leer vite.config.ts.
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
