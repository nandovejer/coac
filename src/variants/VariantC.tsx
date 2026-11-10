import { SEASON } from "../config/season";
import { ThemeModeSwitch } from "../components/layout/ThemeModeSwitch";
import { BroadcastIcon, MonitorIcon, PlayIcon, SearchIcon } from "../components/ui/icons";
import { formatSessionTitleDate, formatShortDate } from "../lib/dates";
import { ModalidadFilter, PreviousNote } from "./parts";
import { pad2, useProgramme, useRemaining } from "./useProgramme";
import "./VariantC.css";

const RANKING_LABEL = { top: "Imprescindible", ok: "Recomendada", standar: "" } as const;

/**
 * Variante C · «Agenda»: una app amable. Tarjetas redondeadas, línea de tiempo
 * con la hora a la izquierda y el semáforo tiñendo cada tarjeta. `skin` cambia
 * solo el aspecto (ver VariantD).
 */
export default function VariantC({ skin }: { skin?: string }) {
  const p = useProgramme();
  const remaining = useRemaining(p.live ? null : p.schedule.upcomingSession?.startsAt);

  return (
    <div className="coac-vc" data-view={p.mode} data-skin={skin}>
      <aside className="coac-vc__side">
        <header className="coac-vc__brand">
          <span className="coac-vc__logo" aria-hidden="true">
            QC
          </span>
          <div>
            <h1 className="coac-vc__title">¿Quién canta hoy?</h1>
            <p className="coac-vc__phase">
              COAC {SEASON.year} · {SEASON.phaseTitle}
            </p>
          </div>
        </header>

        <div className="coac-vc__search" id="searchAuthor">
          <label className="coac-sr-only" htmlFor="vc-search">
            Buscar autor, autora o agrupación
          </label>
          <div className="coac-vc__field">
            <SearchIcon />
            <input
              id="vc-search"
              type="text"
              enterKeyHint="search"
              autoComplete="off"
              placeholder="Busca autor, autora o agrupación"
              value={p.term}
              onChange={(event) => p.setTerm(event.target.value)}
            />
          </div>
          <div className="coac-vc__chips" role="group" aria-label="Filtrar por modalidad">
            <ModalidadFilter value={p.modalidad} onChange={p.setModalidad} className="coac-vc__chip" />
          </div>
        </div>

        <section className="coac-vc__now" aria-label="Estado">
          {p.live ? (
            <>
              <p className="coac-vc__now-label" data-live>
                <BroadcastIcon inline /> En directo
              </p>
              <p className="coac-vc__now-main">{p.live.group.autor}</p>
              <p className="coac-vc__now-sub">{p.live.group.nombre}</p>
            </>
          ) : remaining ? (
            <>
              <p className="coac-vc__now-label">Empieza en</p>
              <div className="coac-vc__tiles" aria-hidden="true">
                {(
                  [
                    [remaining.days, "días"],
                    [remaining.hours, "h"],
                    [remaining.minutes, "min"],
                    [remaining.seconds, "s"],
                  ] as const
                ).map(([value, unit]) => (
                  <span key={unit} className="coac-vc__tile">
                    <strong>{pad2(value)}</strong>
                    {unit}
                  </span>
                ))}
              </div>
              <p className="coac-sr-only">
                Faltan {remaining.days} días, {remaining.hours} horas y {remaining.minutes} minutos.
              </p>
            </>
          ) : (
            <p className="coac-vc__now-label">La fase ha terminado</p>
          )}
          <a className="coac-vc__cta" href={SEASON.liveUrl} target="_blank" rel="noopener noreferrer">
            <MonitorIcon /> Ver el directo
          </a>
        </section>

        <nav className="coac-vc__calendar" aria-label="Sesiones de la fase">
          <p className="coac-vc__heading">Todas las sesiones</p>
          <ol className="coac-vc__days">
            {p.all.map((session) => (
              <li key={session.date}>
                <button
                  type="button"
                  className="coac-vc__day"
                  data-status={session.status}
                  aria-pressed={p.mode === "day" && p.selectedDate === session.date}
                  onClick={() => {
                    p.reset();
                    p.setSelectedDate(session.date);
                  }}
                >
                  <span className="coac-vc__day-name">{formatShortDate(session.date)}</span>
                  <span className="coac-vc__day-count">
                    {p.dayLabel(session.date) || `${session.performances.length} agrup.`}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      <main id="siteMain" className="coac-vc__main">
        {p.mode !== "focus" && (
          <p className="coac-vc__context" role="status">
            <span>
              {p.mode === "search"
                ? `${p.count} ${p.count === 1 ? "agrupación encontrada" : "agrupaciones encontradas"}`
                : "Sesión elegida"}
            </span>
            <button type="button" className="coac-vc__reset" onClick={p.reset}>
              Volver a hoy y mañana
            </button>
          </p>
        )}

        {p.sections.map(({ key, label, session, performances }) => (
          <section key={key} className="coac-vc__session" aria-labelledby={`vc-${key}`}>
            <header className="coac-vc__session-head">
              {label && <span className="coac-vc__pill">{label}</span>}
              <h2 id={`vc-${key}`} className="coac-vc__session-title">
                {formatSessionTitleDate(session.date)}
              </h2>
              <p className="coac-vc__session-meta">
                {session.performances.length} agrupaciones · {session.performances[0]?.estimatedTime}–
                {session.estimatedEndTime} aprox.
              </p>
            </header>
            <ol className="coac-vc__timeline">
              {performances.map(({ group, estimatedTime, isLive }) => (
                <li key={group.id} className="coac-vc__slot" data-live={isLive || undefined}>
                  <p className="coac-vc__time">
                    {estimatedTime}
                    <span className="coac-vc__dot" aria-hidden="true" />
                  </p>
                  <article className="coac-vc__card" data-ranking={group.ranking}>
                    <p className="coac-vc__badges">
                      {isLive && (
                        <span className="coac-vc__badge" data-kind="live">
                          <BroadcastIcon inline /> En directo
                        </span>
                      )}
                      {RANKING_LABEL[group.ranking] && (
                        <span className="coac-vc__badge" data-kind="ranking">
                          {RANKING_LABEL[group.ranking]}
                        </span>
                      )}
                      <span className="coac-vc__badge" data-modalidad={group.modalidad}>
                        {group.modalidad.charAt(0) + group.modalidad.slice(1).toLowerCase()}
                      </span>
                      <span className="coac-vc__city">{group.ciudad}</span>
                    </p>
                    <h3 className="coac-vc__author">{group.autor}</h3>
                    <p className="coac-vc__name">{group.nombre}</p>
                    {group.previous && (
                      <p className="coac-vc__previous-row">
                        {"name" in group.previous && <PlayIcon inline />}
                        <PreviousNote previous={group.previous} className="coac-vc__previous" />
                      </p>
                    )}
                  </article>
                </li>
              ))}
            </ol>
          </section>
        ))}

        {p.sections.length === 0 && (
          <p className="coac-vc__empty">No hay nada con ese nombre. Prueba con otro.</p>
        )}

        <footer className="coac-vc__footer">
          <ThemeModeSwitch />
          <p>Las horas son estimadas ({SEASON.minutesPerGroup} min por agrupación).</p>
        </footer>
      </main>
    </div>
  );
}
