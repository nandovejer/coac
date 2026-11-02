export function SiteFooter() {
  return (
    <footer className="text-center p-4 text-gray-600 bg-slate-50 pb-24">
      <aside>
        <p>
          {" "}
          Creado por{" "}
          <a className="text-blue-700 underline  " href="https://twitter.com/nandovejer">
            Nando Muñoz
          </a>{" "}
          y bajo{" "}
          <a className="text-blue-700 underline  " href="https://es.wikipedia.org/wiki/MIT_License">
            Licencia MIT
          </a>
          .
        </p>
      </aside>
    </footer>
  );
}
