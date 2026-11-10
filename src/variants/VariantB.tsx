import { SEASON } from "../config/season";
import { ThemeModeSwitch } from "../components/layout/ThemeModeSwitch";
import { parseSessionDate } from "../lib/dates";
import type { Modalidad } from "../types";
import { ModalidadFilter, PreviousNote } from "./parts";
import { pad2, useProgramme, useRemaining } from "./useProgramme";
import "./VariantB.css";

const CODE: Record<Modalidad, string> = { CORO: "COR", COMPARSA: "COM", CHIRIGOTA: "CHI", CUARTETO: "CUA" };
const RANKING_LABEL = { top: "Imprescindible", ok: "Recomendada", standar: "" } as const;

/** `dd/mm/yyyy` → letra del día y número, para el calendario compacto. */
function dayParts(date: string) {
  const parsed = parseSessionDate(date);
  if (!parsed) return { weekday: "", day: date, long: date };
  const utc = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12));
  const format = (options: Intl.DateTimeFormatOptions) =>
    utc.toLocaleDateString("es-ES", { ...options, timeZone: "UTC" });
  return {
    weekday: format({ weekday: "short" }).replace(".", "").slice(0, 3),
    day: String(parsed.day),
    long: format({ weekday: "short", day: "numeric", month: "short" }).replaceAll(".", ""),
  };
}

/**
 * Variante B · «Tablero»: el panel de salidas de una estación. Oscuro, denso,
 * monoespaciado en horas y códigos; el buscador filtra el tablero en el sitio.
 */
export default function VariantB() {
  const p = useProgramme();
  const remaining = useRemaining(p.live ? null : p.schedule.upcomingSession?.startsAt);

  return (
    <div className="coac-vb" data-view={p.mode}>
      <aside className="coac-vb__side">
        <header className="coac-vb__brand">
          <p className="coac-vb__code">
            COAC<span>/{SEASON.year}</span>
          </p>
          <h1 className="coac-vb__title">¿Quién canta hoy?</h1>
          <p className="coac-vb__phase">{SEASON.phaseTitle}</p>
        </header>

        <section className="coac-vb__status" aria-label="Estado">
          {p.live ? (
            <>
              <p className="coac-vb__status-label" data-live>
                En directo
              </p>
              <p className="coac-vb__status-main">{p.live.group.autor}</p>
              <p className="coac-vb__status-sub">{p.live.group.nombre}</p>
            </>
          ) : remaining ? (
            <>
              <p className="coac-vb__status-label">Próxima sesión en</p>
              <p className="coac-vb__clock" aria-hidden="true">
                {remaining.days > 0 && (
                  <>
                    {remaining.days}
                    <small>d</small>{" "}
                  </>
                )}
                {pad2(remaining.hours)}:{pad2(remaining.minutes)}:{pad2(remaining.seconds)}
              </p>
              <p className="coac-sr-only">
                Faltan {remaining.days} días, {remaining.hours} horas y {remaining.minutes} minutos.
              </p>
            </>
          ) : (
            <p className="coac-vb__status-label">Fase terminada</p>
          )}
          <a className="coac-vb__cta" href={SEASON.liveUrl} target="_blank" rel="noopener noreferrer">
            Ver el directo ↗
          </a>
        </section>

        <div className="coac-vb__search" id="searchAuthor">
          <label className="coac-vb__label" htmlFor="vb-search">
            Filtrar el tablero
          </label>
          <div className="coac-vb__field">
            <span aria-hidden="true">›</span>
            <input
              id="vb-search"
              type="text"
              enterKeyHint="search"
              autoComplete="off"
              placeholder="autor, autora o agrupación"
              value={p.term}
              onChange={(event) => p.setTerm(event.target.value)}
            />
          </div>
          <div className="coac-vb__filters" role="group" aria-label="Filtrar por modalidad">
            <ModalidadFilter value={p.modalidad} onChange={p.setModalidad} className="coac-vb__filter" />
          </div>
        </div>

        <nav className="coac-vb__calendar" aria-label="Sesiones de la fase">
          <p className="coac-vb__label">Sesiones</p>
          <ol className="coac-vb__days">
            {p.all.map((session) => {
              const { weekday, day } = dayParts(session.date);
              return (
                <li key={session.date}>
                  <button
                    type="button"
                    className="coac-vb__day"
                    data-status={session.status}
                    aria-pressed={p.mode === "day" && p.selectedDate === session.date}
                    onClick={() => {
                      p.reset();
                      p.setSelectedDate(session.date);
                    }}
                  >
                    <span className="coac-vb__day-week">{weekday}</span>
                    <span className="coac-vb__day-number">{day}</span>
                    <span className="coac-sr-only">, {session.performances.length} agrupaciones</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </aside>

      <main id="siteMain" className="coac-vb__main">
        {p.mode !== "focus" && (
          <p className="coac-vb__context" role="status">
            <span>
              {p.mode === "search"
                ? `${p.count} ${p.count === 1 ? "resultado" : "resultados"}`
                : "Sesión elegida"}
            </span>
            <button type="button" className="coac-vb__reset" onClick={p.reset}>
              ← Hoy y mañana
            </button>
          </p>
        )}

        {p.sections.map(({ key, label, session, performances }) => (
          <section key={key} className="coac-vb__board" aria-labelledby={`vb-${key}`}>
            <header className="coac-vb__board-head">
              <h2 id={`vb-${key}`} className="coac-vb__board-title">
                {label && <span className="coac-vb__board-label">{label}</span>}
                {dayParts(session.date).long}
              </h2>
              <p className="coac-vb__board-meta">
                {session.performances.length} agrup. · {session.performances[0]?.estimatedTime}–
                {session.estimatedEndTime}
              </p>
            </header>
            <ol className="coac-vb__rows">
              {performances.map(({ group, estimatedTime, isLive }) => (
                <li
                  key={group.id}
                  className="coac-vb__row"
                  data-ranking={group.ranking}
                  data-live={isLive || undefined}
                >
                  <span className="coac-vb__lamp" aria-hidden="true" />
                  <p className="coac-vb__time">
                    {isLive ? <strong className="coac-vb__live">Directo</strong> : estimatedTime}
                  </p>
                  <div className="coac-vb__who">
                    <h3 className="coac-vb__author">{group.autor}</h3>
                    <p className="coac-vb__name">{group.nombre}</p>
                    <PreviousNote previous={group.previous} className="coac-vb__previous" />
                  </div>
                  <p className="coac-vb__tags">
                    <abbr className="coac-vb__tag" data-modalidad={group.modalidad} title={group.modalidad}>
                      {CODE[group.modalidad]}
                    </abbr>
                    <span>{group.ciudad}</span>
                    {RANKING_LABEL[group.ranking] && (
                      <span className="coac-vb__ranking">{RANKING_LABEL[group.ranking]}</span>
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ))}

        {p.sections.length === 0 && <p className="coac-vb__empty">Sin resultados. Cambia el filtro.</p>}

        <footer className="coac-vb__footer">
          <ThemeModeSwitch />
          <p>Horas estimadas · {SEASON.minutesPerGroup} min por agrupación</p>
        </footer>
      </main>
    </div>
  );
}
