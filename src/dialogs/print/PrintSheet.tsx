import { SEASON } from "../../config/season";
import { FallaLogo } from "../../components/ui/FallaLogo";
import type { PerformanceView, SessionView } from "../../domain/schedule";
import { formatSessionTitleDate } from "../../lib/dates";
import { actOrder, capitalize } from "./format";
import { Confetti, MaskArt } from "./PorraArt";
// Los colores y dibujos del cartel (--pp-*, antifaz, confeti) son los de la porra
import "./PorraSheet.css";
import "./PrintSheet.css";

/** Una sesión del horario impreso, con solo las filas que pasan los filtros. */
export interface PrintBlock {
  session: SessionView;
  rows: PerformanceView[];
}

const RANKING_TEXT = { top: "Imprescindible", ok: "Recomendada", standar: "" } as const;

/**
 * La hoja del horario: la misma en la vista previa del modal y al imprimir.
 * Pensada para papel y para gastar pocas hojas: dos columnas de sesiones por
 * A4, cada sesión en su tabla (nº de orden, agrupación con autoría y ciudad,
 * y modalidad). Sin horas: son estimadas y en papel no se actualizan;
 * el orden sí es el oficial. Tinta negra, líneas finas y el semáforo como forma (círculo lleno:
 * imprescindible; anillo: recomendada), que se entiende también en blanco y negro.
 */
export function PrintSheet({ blocks }: { blocks: PrintBlock[] }) {
  return (
    <article className="coac-print-sheet coac-porra coac-print-sheet--poster">
      <header className="coac-print-sheet__head">
        <Confetti />
        <MaskArt />
        <FallaLogo className="coac-print-sheet__falla" />
        <p className="coac-print-sheet__brand">¿Quién canta hoy? · COAC {SEASON.year}</p>
        <h2 className="coac-print-sheet__title">Mi horario · {SEASON.phaseTitle}</h2>
        <p className="coac-print-sheet__note">
          Por orden de actuación.{" "}
          <span className="coac-print-sheet__mark" data-ranking="top" aria-hidden="true" />
          Imprescindible <span className="coac-print-sheet__mark" data-ranking="ok" aria-hidden="true" />
          Recomendada. Recomendaciones personales, no del jurado.
        </p>
      </header>

      <div className="coac-print-sheet__sessions">
        {blocks.map(({ session, rows }) => (
          <section key={session.date} className="coac-print-sheet__session">
            <h3 className="coac-print-sheet__day">
              {formatSessionTitleDate(session.date)}
              <span>
                {" "}
                · {rows.length} {rows.length === 1 ? "agrupación" : "agrupaciones"}
              </span>
            </h3>
            <table className="coac-print-sheet__table">
              <thead>
                <tr>
                  <th scope="col" className="coac-print-sheet__order">
                    <abbr title="Orden de actuación">Nº</abbr>
                  </th>
                  <th scope="col">Agrupación</th>
                  <th scope="col" className="coac-print-sheet__modalidad">
                    Modalidad
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ group }) => (
                  <tr key={group.id} data-ranking={group.ranking}>
                    <td className="coac-print-sheet__order">{actOrder(session, group)}</td>
                    <td>
                      <span className="coac-print-sheet__name">
                        {group.ranking !== "standar" && (
                          <span
                            className="coac-print-sheet__mark"
                            data-ranking={group.ranking}
                            aria-hidden="true"
                          />
                        )}
                        {RANKING_TEXT[group.ranking] && (
                          <span className="coac-sr-only">{RANKING_TEXT[group.ranking]}: </span>
                        )}
                        {group.nombre}
                      </span>
                      <span className="coac-print-sheet__meta">
                        <span className="coac-print-sheet__author">{group.autor}</span> · {group.ciudad}
                      </span>
                    </td>
                    <td className="coac-print-sheet__modalidad">{capitalize(group.modalidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <footer className="coac-print-sheet__foot">
        <span>¡Que suene el Carnaval!</span>
        <span>coac.com.es · Web no oficial</span>
      </footer>
    </article>
  );
}
