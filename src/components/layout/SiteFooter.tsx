import "./SiteFooter.css";

export function SiteFooter() {
  return (
    <footer className="coac-site-footer">
      <aside>
        <p>
          Hecho con{" "}
          <a className="coac-site-footer__link" href="https://github.com/nandovejer/luz">
            Luz
          </a>{" "}
          por{" "}
          <a className="coac-site-footer__link" href="https://twitter.com/nandovejer">
            Nando Muñoz
          </a>
          . Código abierto bajo{" "}
          <a className="coac-site-footer__link" href="https://es.wikipedia.org/wiki/MIT_License">
            licencia MIT
          </a>
          .
        </p>
      </aside>
    </footer>
  );
}
