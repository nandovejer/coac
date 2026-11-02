import "./SiteFooter.css";

export function SiteFooter() {
  return (
    <footer className="coac-site-footer">
      <aside>
        <p>
          Creado por{" "}
          <a className="coac-site-footer__link" href="https://twitter.com/nandovejer">
            Nando Muñoz
          </a>{" "}
          y bajo{" "}
          <a className="coac-site-footer__link" href="https://es.wikipedia.org/wiki/MIT_License">
            Licencia MIT
          </a>
          .
        </p>
      </aside>
    </footer>
  );
}
