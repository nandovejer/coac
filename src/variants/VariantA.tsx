import { SEASON } from "../config/season";
import { SITE } from "../config/site";
import { ThemeModeSwitch } from "../components/layout/ThemeModeSwitch";
import { formatSessionTitleDate, formatShortDate } from "../lib/dates";
import { ModalidadFilter, PreviousNote } from "./parts";
import { pad2, useProgramme, useRemaining } from "./useProgramme";
import "./VariantA.css";

const RANKING_LABEL = { top: "Imprescindible", ok: "Recomendada", standar: "" } as const;

/**
 * Variante A · «Programa de mano»: editorial, como el programa impreso de un
 * teatro. Serifa, papel, filetes finos y el orden de actuación numerado.
 */
export default function VariantA() {
  const p = useProgramme();
  const remaining = useRemaining(p.live ? null : p.schedule.upcomingSession?.startsAt);

  return (
    <div className="coac-va" data-view={p.mode}>
      <aside className="coac-va__side">
        <header className="coac-va__masthead">
          <p className="coac-va__kicker">
            {SITE.venue} · {SITE.city}
          </p>
          <h1 className="coac-va__title">
            ¿Quién canta <em>hoy</em>?
          </h1>
          <p className="coac-va__phase">
            COAC {SEASON.year} — {SEASON.phaseTitle}
          </p>
        </header>

        <p className="coac-va__status">
          {p.live ? (
            <>
              <strong className="coac-va__live">En directo</strong> {p.live.group.autor},{" "}
              <em>{p.live.group.nombre}</em>.
            </>
          ) : remaining ? (
            <>
              Se alza el telón en{" "}
              <strong>
                {remaining.days > 0 && `${remaining.days} d `}
                {pad2(remaining.hours)}:{pad2(remaining.minutes)}:{pad2(remaining.seconds)}
              </strong>
              .
            </>
          ) : (
            "La fase ha terminado."
          )}{" "}
          <a className="coac-va__link" href={SEASON.liveUrl} target="_blank" rel="noopener noreferrer">
            Ver el directo
          </a>
        </p>

        <div className="coac-va__search" id="searchAuthor">
          <label className="coac-va__label" htmlFor="va-search">
            Buscar autor, autora o agrupación
          </label>
          <input
            id="va-search"
            className="coac-va__input"
            type="text"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Escribe un nombre…"
            value={p.term}
            onChange={(event) => p.setTerm(event.target.value)}
          />
          <div className="coac-va__filters" role="group" aria-label="Filtrar por modalidad">
            <ModalidadFilter value={p.modalidad} onChange={p.setModalidad} className="coac-va__filter" />
          </div>
        </div>

        <nav className="coac-va__calendar" aria-label="Sesiones de la fase">
          <p className="coac-va__label">Calendario</p>
          <ol className="coac-va__days">
            {p.all.map((session) => (
              <li key={session.date}>
                <button
                  type="button"
                  className="coac-va__day"
                  data-status={session.status}
                  aria-pressed={p.mode === "day" && p.selectedDate === session.date}
                  onClick={() => {
                    p.reset();
                    p.setSelectedDate(session.date);
                  }}
                >
                  <span>{formatShortDate(session.date)}</span>
                  <span className="coac-va__day-note">
                    {p.dayLabel(session.date) || session.performances.length}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      <main id="siteMain" className="coac-va__main">
        {p.mode !== "focus" && (
          <p className="coac-va__context" role="status">
            {p.mode === "search"
              ? `${p.count} ${p.count === 1 ? "agrupación encontrada" : "agrupaciones encontradas"}.`
              : "Sesión elegida en el calendario."}{" "}
            <button type="button" className="coac-va__link" onClick={p.reset}>
              Volver a hoy y mañana
            </button>
          </p>
        )}

        {p.sections.map(({ key, label, session, performances }) => (
          <section key={key} className="coac-va__session" aria-labelledby={`va-${key}`}>
            <header className="coac-va__session-head">
              {label && <p className="coac-va__session-label">{label}</p>}
              <h2 id={`va-${key}`} className="coac-va__session-title">
                {formatSessionTitleDate(session.date)}
              </h2>
              <p className="coac-va__session-meta">
                {session.performances.length} agrupaciones · de {session.performances[0]?.estimatedTime} a{" "}
                {session.estimatedEndTime} aprox.
              </p>
            </header>
            <ol className="coac-va__lineup">
              {performances.map(({ group, estimatedTime, isLive }) => (
                <li
                  key={group.id}
                  className="coac-va__act"
                  data-ranking={group.ranking}
                  data-live={isLive || undefined}
                >
                  <span className="coac-va__order" aria-hidden="true">
                    {pad2(session.performances.findIndex((x) => x.group.id === group.id) + 1)}
                  </span>
                  <div className="coac-va__act-body">
                    <p className="coac-va__act-top">
                      {isLive ? (
                        <strong className="coac-va__live">En directo</strong>
                      ) : (
                        <span className="coac-va__time">{estimatedTime}</span>
                      )}
                      <span className="coac-va__genre">{group.modalidad}</span>
                      <span>{group.ciudad}</span>
                      {RANKING_LABEL[group.ranking] && (
                        <span className="coac-va__ranking">{RANKING_LABEL[group.ranking]}</span>
                      )}
                    </p>
                    <h3 className="coac-va__author">{group.autor}</h3>
                    <p className="coac-va__name">{group.nombre}</p>
                    <PreviousNote previous={group.previous} className="coac-va__previous" />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}

        {p.sections.length === 0 && (
          <p className="coac-va__empty">Nada coincide con la búsqueda. Prueba con otro nombre.</p>
        )}

        <footer className="coac-va__footer">
          <ThemeModeSwitch />
          <p>Las horas son estimadas: {SEASON.minutesPerGroup} minutos por agrupación.</p>
        </footer>
      </main>
    </div>
  );
}
