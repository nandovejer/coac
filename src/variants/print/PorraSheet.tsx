import { SEASON } from "../../config/season";
import { Confetti, MaskArt, ModalidadIcon, Stamp } from "./PorraArt";
import { PRIZES, type Porra, type PorraSection } from "./porra";
import "./PorraSheet.css";

/** Casilla vacía para marcar a boli. */
const Box = () => <span className="coac-porra__box" aria-hidden="true" />;

/**
 * Reparte las modalidades en dos columnas, en orden, con el alto lo más
 * parecido posible (cada lista va a su vez en dos subcolumnas). La derecha
 * lleva además el recuadro «Recuerda».
 */
function splitColumns(sections: PorraSection[], prizes: boolean) {
  const weight = (section: PorraSection) =>
    4 + (prizes ? section.groups.length * 1.6 : Math.ceil(section.groups.length / 2));
  const total = sections.reduce((sum, section) => sum + weight(section), 0) + 5;
  let best = { index: sections.length, diff: Infinity };
  let left = 0;
  for (let index = 0; index <= sections.length; index++) {
    const diff = Math.abs(left - (total - left));
    if (diff < best.diff) best = { index, diff };
    if (index < sections.length) left += weight(sections[index]);
  }
  return [sections.slice(0, best.index), sections.slice(best.index)];
}

function Section({ section, prizes }: { section: PorraSection; prizes: boolean }) {
  return (
    <section className="coac-porra__section" data-modalidad={section.modalidad}>
      <h3 className="coac-porra__modalidad">
        <ModalidadIcon modalidad={section.modalidad} />
        <span className="coac-porra__banner">
          {section.title} <span>({section.groups.length})</span>
        </span>
      </h3>
      {prizes ? (
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
      ) : (
        <ul className="coac-porra__list">
          {section.groups.map((group) => (
            <li key={group.id} className="coac-porra__item">
              <Box />
              <span>{group.nombre}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Hoja de la porra: la misma en la vista previa y en papel. Un cartel de
 * carnaval: papel crema, «PORRA» en grande con la pregunta debajo, una cinta
 * con lo que hay que hacer, el sello, los huecos para el nombre y los aciertos,
 * y las modalidades con su color e icono, en dos columnas. En la final, una
 * tabla por modalidad con las casillas del 1.º al 4.º.
 */
export function PorraSheet({ porra }: { porra: Porra }) {
  const prizes = porra.kind === "prizes";
  const [left, right] = splitColumns(porra.sections, prizes);

  return (
    <article className="coac-print-sheet coac-porra" data-kind={porra.kind}>
      <header className="coac-porra__head">
        <Confetti />
        <MaskArt />
        <p className="coac-porra__season">COAC {SEASON.year}</p>
        <h2 className="coac-porra__title">
          Porra <span className="coac-sr-only">· {porra.question}</span>
        </h2>
        <p className="coac-porra__question" aria-hidden="true">
          {porra.question}
        </p>
        <p className="coac-porra__ribbon">{porra.ribbon}</p>
        <Stamp />
      </header>

      <p className="coac-porra__fill">
        <span>
          Nombre: <span className="coac-porra__line" />
        </span>
        <span>
          Aciertos: <span className="coac-porra__line" />
        </span>
      </p>

      <div className="coac-porra__board">
        <div className="coac-porra__column">
          {left.map((section) => (
            <Section key={section.modalidad} section={section} prizes={prizes} />
          ))}
        </div>
        <div className="coac-porra__column">
          {right.map((section) => (
            <Section key={section.modalidad} section={section} prizes={prizes} />
          ))}
          <aside className="coac-porra__remember">
            <p className="coac-porra__remember-title">Recuerda</p>
            <p>{porra.remember}</p>
          </aside>
        </div>
      </div>

      <footer className="coac-porra__foot">
        <span>¿Quién canta hoy? · COAC {SEASON.year}</span>
        <span>coac.com.es</span>
      </footer>
    </article>
  );
}
