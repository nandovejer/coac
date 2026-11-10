import { SEASON } from "../../config/season";
import { PRIZES, type Porra } from "./porra";
import "./PorraSheet.css";

/** Casilla vacía para marcar a boli. */
const Box = () => <span className="coac-porra__box" aria-hidden="true" />;

/**
 * Hoja de la porra: la misma en la vista previa y en papel. Papel blanco y
 * tinta negra, como el horario. Para adivinar quién pasa: tres columnas con una
 * casilla por agrupación (cabe en un A4 aun en preliminares). En la final: una
 * tabla por modalidad con las casillas del 1.º al 4.º.
 */
export function PorraSheet({ porra }: { porra: Porra }) {
  return (
    <article className="coac-print-sheet coac-porra" data-kind={porra.kind}>
      <header className="coac-print-sheet__head coac-porra__head">
        <p className="coac-print-sheet__brand">¿Quién canta hoy? · COAC {SEASON.year}</p>
        <h2 className="coac-print-sheet__title">{porra.title}</h2>
        <p className="coac-porra__question">{porra.question}</p>
        <p className="coac-print-sheet__note">{porra.howTo}</p>
        <p className="coac-porra__fill">
          <span>
            Nombre <span className="coac-porra__line coac-porra__line--long" />
          </span>
          <span>
            Aciertos <span className="coac-porra__line" />
          </span>
        </p>
      </header>

      {porra.kind === "pass" ? (
        <div className="coac-porra__columns">
          {porra.sections.map((section) => (
            <section key={section.modalidad} className="coac-porra__section">
              <h3 className="coac-porra__modalidad">
                {section.title} <span>({section.groups.length})</span>
              </h3>
              <ul className="coac-porra__list">
                {section.groups.map((group) => (
                  <li key={group.id} className="coac-porra__item">
                    <Box />
                    <span>{group.nombre}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        porra.sections.map((section) => (
          <section key={section.modalidad} className="coac-porra__section">
            <h3 className="coac-porra__modalidad">{section.title}</h3>
            <table className="coac-porra__prizes">
              <thead>
                <tr>
                  <th scope="col">Agrupación</th>
                  {PRIZES.map((prize) => (
                    <th key={prize} scope="col">
                      {prize}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.groups.map((group) => (
                  <tr key={group.id}>
                    <td>
                      <span className="coac-porra__name">{group.nombre}</span>
                      <span className="coac-print-sheet__author">{group.autor}</span>
                    </td>
                    {PRIZES.map((prize) => (
                      <td key={prize}>
                        <Box />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))
      )}

      <footer className="coac-print-sheet__foot">coac.com.es</footer>
    </article>
  );
}
