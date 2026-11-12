import { lazy, Suspense, useCallback, useState, type CSSProperties, type MouseEvent } from "react";
import { SEASON } from "../config/season";
import { ThemeModeSwitch } from "../components/layout/ThemeModeSwitch";
import { FallaLogo } from "../components/ui/FallaLogo";
import {
  BroadcastIcon,
  CalendarIcon,
  LiveIcon,
  PlayIcon,
  PrinterIcon,
  SearchIcon,
} from "../components/ui/icons";
import { formatSessionTitleDate, formatShortDate } from "../lib/dates";
import { DayCarousel } from "../app/DayCarousel";
import { ModalidadFilter, PreviousNote } from "../app/parts";
import { PHASE_STATUS_LABEL, PHASES, isHomePhase, phaseStatus } from "../app/phases";
import { PRIVACY_HASH } from "../app/privacy/policy";
import { PrivacyNotice } from "../app/privacy/PrivacyNotice";
import { usePrivacyRoute } from "../app/privacy/usePrivacyRoute";
import { addMinutes, pad2, useProgramme, useRemaining } from "../app/useProgramme";
import "./AgendaPrototype.css";

// El modal de imprimir (y su CSS de impresión) solo se descarga al pedirlo.
const loadPrintSchedule = () => import("../app/print/PrintSchedule");
const PrintSchedule = lazy(loadPrintSchedule);
const loadAbout = () => import("../app/about/AboutDialog");
const AboutDialog = lazy(loadAbout);
const loadPrivacy = () => import("../app/privacy/PrivacyDialog");
const PrivacyDialog = lazy(loadPrivacy);

const RANKING_LABEL = { top: "Imprescindible", ok: "Recomendada", standar: "" } as const;

/** Lleva al buscador (desde la cabecera fija en móvil) y le da el foco. */
function goToSearch() {
  const input = document.getElementById("vc-search");
  if (!input) return;
  input.scrollIntoView({ block: "center" });
  input.focus({ preventScroll: true });
}

const HOME_URL = import.meta.env.BASE_URL;

const STAGE_LABEL = { done: "Ya actuó", next: "A continuación" } as const;

/** Baja al primer bloque del programa (hoy, o la próxima sesión) por debajo de la cabecera fija. */
function scrollToProgramme() {
  const session = document.querySelector<HTMLElement>(".coac-agenda__session");
  if (!session) return;
  const header = document.querySelector<HTMLElement>(".coac-agenda__brand");
  const offset = header && getComputedStyle(header).position === "sticky" ? header.offsetHeight : 0;
  window.scrollTo({ top: session.getBoundingClientRect().top + window.scrollY - offset });
  session.querySelector<HTMLElement>(".coac-agenda__session-title")?.focus({ preventScroll: true });
}

/** Centra la tarjeta de la agrupación y le pasa el foco (para teclado y lector de pantalla). */
function scrollToGroup(id: string) {
  const card = document.getElementById(id);
  if (!card) return;
  card.scrollIntoView({ block: "center" });
  card.focus({ preventScroll: true });
}

/**
 * Prototipo «Agenda»: una app amable. Tarjetas redondeadas, línea de tiempo
 * con la hora a la izquierda y el semáforo tiñendo cada tarjeta. `skin` cambia
 * solo el aspecto (ver BoardPrototype).
 */
export default function AgendaPrototype({ skin }: { skin?: string }) {
  const p = useProgramme();
  const [printOpen, setPrintOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { privacyOpen, openPrivacy, closePrivacy } = usePrivacyRoute();
  // Botón «Hoy y mañana» del modal de imprimir (o las dos próximas). Al abrir van todas.
  const printSoon = (() => {
    const labelled = p.all.filter((s) => ["Hoy", "Mañana"].includes(p.dayLabel(s)));
    if (labelled.length > 0) return labelled.map((s) => s.date);
    const upcoming = p.all.filter((s) => s.status !== "past").slice(0, 2);
    return (upcoming.length > 0 ? upcoming : p.all.slice(-1)).map((s) => s.date);
  })();
  const remaining = useRemaining(p.live ? null : p.schedule.upcomingSession?.startsAt);

  // La portada es siempre la fase en curso: sin búsqueda ni día elegido, arriba del todo.
  const goHome = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    p.reset();
    window.scrollTo({ top: 0 });
  };

  const closePrint = useCallback(() => setPrintOpen(false), []);
  const closeAbout = useCallback(() => setAboutOpen(false), []);

  // Vuelve al programa de hoy (sin búsqueda ni día elegido) y baja hasta él.
  const goToToday = () => {
    p.reset();
    requestAnimationFrame(() => requestAnimationFrame(scrollToProgramme));
  };

  // Lleva a la agrupación en directo; si el programa muestra otra cosa, vuelve antes a hoy.
  const goToLive = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!p.live) return;
    event.preventDefault();
    const id = p.live.group.id;
    if (document.getElementById(id)) return scrollToGroup(id);
    p.reset();
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToGroup(id)));
  };

  return (
    <div className="coac-agenda" data-view={p.mode} data-skin={skin}>
      {/* En escritorio, columna izquierda fija; en móvil no pinta caja (display: contents)
          y la cabecera queda fija arriba de toda la página. */}
      <div className="coac-agenda__rail">
        <header className="coac-agenda__brand">
          <a className="coac-agenda__home" href={HOME_URL} onClick={goHome}>
            <FallaLogo className="coac-agenda__logo" />
            <div className="coac-agenda__brand-text">
              <h1 className="coac-agenda__title">¿Quién canta hoy?</h1>
              <p className="coac-agenda__phase">
                COAC {SEASON.year} · {SEASON.phaseTitle}
              </p>
            </div>
          </a>
          {/* Accesos rápidos (solo móvil): iconos con el nombre para lectores de pantalla */}
          <nav className="coac-agenda__actions" aria-label="Accesos rápidos">
            <button type="button" className="coac-agenda__action" onClick={goToSearch} title="Buscar">
              <SearchIcon />
              <span className="coac-sr-only">Buscar</span>
            </button>
            <a
              className="coac-agenda__action"
              href={SEASON.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Ver el directo"
              data-live={p.live ? "" : undefined}
            >
              <LiveIcon />
              <span className="coac-sr-only">Ver el directo (se abre en otra pestaña)</span>
            </a>
            <button type="button" className="coac-agenda__action" onClick={goToToday} title="Horario de hoy">
              <CalendarIcon />
              <span className="coac-sr-only">Horario de hoy</span>
            </button>
          </nav>
          {p.live && (
            <a className="coac-agenda__live-strip" href={`#${p.live.group.id}`} onClick={goToLive}>
              <span className="coac-agenda__live-dot" aria-hidden="true" />
              <span className="coac-agenda__live-strip-label">En directo</span>
              <span className="coac-agenda__live-strip-name">{p.live.group.autor}</span>
              <span className="coac-agenda__live-strip-go">Ver</span>
            </a>
          )}
        </header>

        <aside className="coac-agenda__side" aria-label="Buscador, estado y sesiones">
          <div className="coac-agenda__search" id="searchAuthor">
            <label className="coac-sr-only" htmlFor="vc-search">
              Buscar autor, autora o agrupación
            </label>
            <div className="coac-agenda__field">
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
            <div className="coac-agenda__chips" role="group" aria-label="Filtrar por modalidad">
              <ModalidadFilter value={p.modalidad} onChange={p.setModalidad} className="coac-agenda__chip" />
            </div>
          </div>

          <section className="coac-agenda__now" aria-label="Estado">
            {p.live ? (
              <>
                <p className="coac-agenda__now-label" data-live>
                  <BroadcastIcon inline /> En directo
                </p>
                <p className="coac-agenda__now-main">{p.live.group.autor}</p>
                <p className="coac-agenda__now-sub">{p.live.group.nombre}</p>
                <a className="coac-agenda__now-link" href={`#${p.live.group.id}`} onClick={goToLive}>
                  Ver en el programa
                </a>
              </>
            ) : remaining ? (
              <>
                <p className="coac-agenda__now-label">Empieza en</p>
                <div className="coac-agenda__tiles" aria-hidden="true">
                  {(
                    [
                      [remaining.days, "días"],
                      [remaining.hours, "horas"],
                      [remaining.minutes, "minutos"],
                      [remaining.seconds, "segundos"],
                    ] as const
                  ).map(([value, unit]) => (
                    <span key={unit} className="coac-agenda__tile">
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
              <p className="coac-agenda__now-label">La fase ha terminado</p>
            )}
            <a className="coac-agenda__cta" href={SEASON.liveUrl} target="_blank" rel="noopener noreferrer">
              <LiveIcon /> Ver el directo
            </a>
          </section>

          <nav className="coac-agenda__calendar" aria-label="Sesiones de la fase">
            {(
              [
                ["Próximas sesiones", p.all.filter((session) => session.status !== "past")],
                ["Ya celebradas", p.all.filter((session) => session.status === "past")],
              ] as const
            ).map(
              ([heading, list]) =>
                list.length > 0 && (
                  <div key={heading} className="coac-agenda__day-group">
                    <p className="coac-agenda__heading">{heading}</p>
                    <DayCarousel>
                      {list.map((session) => (
                        <li key={session.date}>
                          <button
                            type="button"
                            className="coac-agenda__day"
                            data-status={session.status}
                            data-label={p.dayLabel(session) || undefined}
                            aria-pressed={p.mode === "day" && p.selectedDate === session.date}
                            onClick={() => {
                              p.reset();
                              p.setSelectedDate(session.date);
                            }}
                          >
                            <span className="coac-agenda__day-name">{formatShortDate(session.date)}</span>
                            <span className="coac-agenda__day-count">
                              {p.dayLabel(session) || `${session.performances.length} agrup.`}
                            </span>
                          </button>
                        </li>
                      ))}
                    </DayCarousel>
                  </div>
                ),
            )}
          </nav>
        </aside>
      </div>

      <main id="siteMain" className="coac-agenda__main">
        {p.mode !== "focus" && (
          <p className="coac-agenda__context" role="status">
            <span>
              {p.mode === "search"
                ? `${p.count} ${p.count === 1 ? "agrupación encontrada" : "agrupaciones encontradas"}`
                : "Sesión elegida"}
            </span>
            <button type="button" className="coac-agenda__reset" onClick={p.reset}>
              Volver a hoy y mañana
            </button>
          </p>
        )}

        {p.sections.length > 0 && (
          <p className="coac-agenda__legend">
            <span className="coac-agenda__legend-item" data-ranking="top">
              Imprescindible
            </span>
            <span className="coac-agenda__legend-item" data-ranking="ok">
              Recomendada
            </span>
          </p>
        )}

        {p.sections.map(({ key, label, session, performances }) => (
          <section
            key={key}
            className="coac-agenda__session"
            data-status={session.status}
            aria-labelledby={`vc-${key}`}
          >
            <header className="coac-agenda__session-head">
              {label && (
                <span className="coac-agenda__pill" data-label={label}>
                  {label}
                </span>
              )}
              <h2 id={`vc-${key}`} className="coac-agenda__session-title" tabIndex={-1}>
                {formatSessionTitleDate(session.date)}
              </h2>
              <p className="coac-agenda__session-meta">
                {session.performances.length} agrupaciones · {session.performances[0]?.estimatedTime}–
                {session.estimatedEndTime} aprox.
              </p>
            </header>
            <ol className="coac-agenda__timeline">
              {performances.map((performance) => {
                const { group, estimatedTime } = performance;
                const stage = p.stageOf(session, performance);
                const isLive = stage === "live";
                return (
                  <li
                    key={group.id}
                    className="coac-agenda__slot"
                    data-stage={stage}
                    data-live={isLive || undefined}
                  >
                    <p className="coac-agenda__time">
                      {estimatedTime}
                      <span className="coac-agenda__dot" aria-hidden="true" />
                    </p>
                    <article
                      className="coac-agenda__card"
                      id={group.id}
                      tabIndex={-1}
                      data-ranking={group.ranking}
                    >
                      {isLive && (
                        <p className="coac-agenda__live-bar">
                          <BroadcastIcon inline /> Actuando ahora
                          <span className="coac-agenda__live-bar-time">
                            {estimatedTime}–{addMinutes(estimatedTime, SEASON.minutesPerGroup)} aprox.
                          </span>
                        </p>
                      )}
                      <p className="coac-agenda__badges">
                        {session.status === "present" && (stage === "done" || stage === "next") && (
                          <span className="coac-agenda__stage" data-stage={stage}>
                            {STAGE_LABEL[stage]}
                          </span>
                        )}
                        {/* El semáforo se ve en la franja de color; el texto, para lectores de pantalla */}
                        {RANKING_LABEL[group.ranking] && (
                          <span className="coac-sr-only">{RANKING_LABEL[group.ranking]}.</span>
                        )}
                        <span className="coac-agenda__badge" data-modalidad={group.modalidad}>
                          {group.modalidad.charAt(0) + group.modalidad.slice(1).toLowerCase()}
                        </span>
                        <span className="coac-agenda__city">{group.ciudad}</span>
                      </p>
                      <h3 className="coac-agenda__author">{group.autor}</h3>
                      <p className="coac-agenda__name">{group.nombre}</p>
                      {group.previous && (
                        <p className="coac-agenda__previous-row">
                          {"name" in group.previous && <PlayIcon inline />}
                          <PreviousNote previous={group.previous} className="coac-agenda__previous" />
                        </p>
                      )}
                      {isLive && (
                        <span
                          className="coac-agenda__progress"
                          aria-hidden="true"
                          style={{ "--app-progress": p.liveProgress } as CSSProperties}
                        />
                      )}
                    </article>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}

        {p.sections.length === 0 && (
          <p className="coac-agenda__empty">No hay nada con ese nombre. Prueba con otro.</p>
        )}

        <section className="coac-agenda__print" aria-labelledby="vc-print-title">
          <div className="coac-agenda__print-text">
            <h2 id="vc-print-title" className="coac-agenda__print-title">
              Llévate el programa
            </h2>
            <p className="coac-agenda__print-desc">
              Elige sesiones, modalidades y favoritas, y llévatelo en papel, en PDF o como imagen.
            </p>
          </div>
          <button
            type="button"
            className="coac-agenda__print-button"
            aria-haspopup="dialog"
            onPointerEnter={loadPrintSchedule}
            onFocus={loadPrintSchedule}
            onClick={() => setPrintOpen(true)}
          >
            <PrinterIcon />
            Imprime tu horario
          </button>
        </section>

        {printOpen && (
          <Suspense fallback={null}>
            <PrintSchedule
              sessions={p.all}
              soonDates={printSoon}
              dayLabel={p.dayLabel}
              onClose={closePrint}
            />
          </Suspense>
        )}
      </main>

      <footer className="coac-agenda__footer">
        <div className="coac-agenda__footer-inner">
          <nav className="coac-agenda__phases" aria-labelledby="vc-phases-title">
            <h2 id="vc-phases-title" className="coac-agenda__footer-heading">
              Fases del COAC {SEASON.year}
            </h2>
            <ol className="coac-agenda__phase-list">
              {PHASES.map((phase) => {
                const status = phaseStatus(phase, p.schedule.activeSessionDate);
                const content = (
                  <>
                    <span className="coac-agenda__phase-name">{phase.short}</span>
                    <span className="coac-agenda__phase-dates">{phase.dates}</span>
                    <span className="coac-agenda__phase-state">{PHASE_STATUS_LABEL[status]}</span>
                  </>
                );
                const home = isHomePhase(phase);
                return (
                  <li key={phase.id}>
                    {home ? (
                      <a
                        className="coac-agenda__phase-item"
                        data-status={status}
                        data-home
                        href={HOME_URL}
                        aria-current="page"
                        onClick={goHome}
                      >
                        {content}
                      </a>
                    ) : (
                      // Aún no se pueden abrir: enlace desactivado (ver phases.ts)
                      <span
                        className="coac-agenda__phase-item"
                        data-status={status}
                        role="link"
                        aria-disabled="true"
                      >
                        {content}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="coac-agenda__footer-theme">
            <ThemeModeSwitch />
          </div>
          <div className="coac-agenda__footer-text">
            <p className="coac-agenda__footer-pages">
              <button
                type="button"
                className="coac-agenda__footer-page"
                aria-haspopup="dialog"
                onPointerEnter={loadAbout}
                onFocus={loadAbout}
                onClick={() => setAboutOpen(true)}
              >
                Quiénes somos
              </button>
              <a
                className="coac-agenda__footer-page"
                href={PRIVACY_HASH}
                onPointerEnter={loadPrivacy}
                onFocus={loadPrivacy}
                onClick={openPrivacy}
              >
                Privacidad
              </a>
            </p>
            <p>Horas estimadas: {SEASON.minutesPerGroup} min por agrupación, con actuación y montaje.</p>
            <p>
              Hecho con{" "}
              <a className="coac-agenda__footer-link" href="https://github.com/nandovejer/luz">
                Luz
              </a>{" "}
              por{" "}
              <a className="coac-agenda__footer-link" href="https://twitter.com/nandovejer">
                Nando Muñoz
              </a>
              . Código abierto bajo{" "}
              <a className="coac-agenda__footer-link" href="https://es.wikipedia.org/wiki/MIT_License">
                licencia MIT
              </a>
              .
            </p>
          </div>
        </div>
      </footer>

      {aboutOpen && (
        <Suspense fallback={null}>
          <AboutDialog onClose={closeAbout} />
        </Suspense>
      )}
      {privacyOpen && (
        <Suspense fallback={null}>
          <PrivacyDialog onClose={closePrivacy} />
        </Suspense>
      )}

      <PrivacyNotice onOpenPrivacy={openPrivacy} />
    </div>
  );
}
