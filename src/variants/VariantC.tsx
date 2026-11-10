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
import { ModalidadFilter, PreviousNote } from "./parts";
import { PHASE_STATUS_LABEL, PHASES, isHomePhase, phaseStatus } from "./phases";
import { PRIVACY_HASH } from "./privacy/policy";
import { PrivacyNotice } from "./privacy/PrivacyNotice";
import { usePrivacyRoute } from "./privacy/usePrivacyRoute";
import { addMinutes, pad2, useProgramme, useRemaining } from "./useProgramme";
import "./VariantC.css";

// El modal de imprimir (y su CSS de impresión) solo se descarga al pedirlo.
const loadPrintSchedule = () => import("./print/PrintSchedule");
const PrintSchedule = lazy(loadPrintSchedule);
const loadAbout = () => import("./about/AboutDialog");
const AboutDialog = lazy(loadAbout);
const loadPrivacy = () => import("./privacy/PrivacyDialog");
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
  const session = document.querySelector<HTMLElement>(".coac-vc__session");
  if (!session) return;
  const header = document.querySelector<HTMLElement>(".coac-vc__brand");
  const offset = header && getComputedStyle(header).position === "sticky" ? header.offsetHeight : 0;
  window.scrollTo({ top: session.getBoundingClientRect().top + window.scrollY - offset });
  session.querySelector<HTMLElement>(".coac-vc__session-title")?.focus({ preventScroll: true });
}

/** Centra la tarjeta de la agrupación y le pasa el foco (para teclado y lector de pantalla). */
function scrollToGroup(id: string) {
  const card = document.getElementById(id);
  if (!card) return;
  card.scrollIntoView({ block: "center" });
  card.focus({ preventScroll: true });
}

/**
 * Variante C · «Agenda»: una app amable. Tarjetas redondeadas, línea de tiempo
 * con la hora a la izquierda y el semáforo tiñendo cada tarjeta. `skin` cambia
 * solo el aspecto (ver VariantD).
 */
export default function VariantC({ skin }: { skin?: string }) {
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
    <div className="coac-vc" data-view={p.mode} data-skin={skin}>
      {/* En escritorio, columna izquierda fija; en móvil no pinta caja (display: contents)
          y la cabecera queda fija arriba de toda la página. */}
      <div className="coac-vc__rail">
        <header className="coac-vc__brand">
          <a className="coac-vc__home" href={HOME_URL} onClick={goHome}>
            <FallaLogo className="coac-vc__logo" />
            <div className="coac-vc__brand-text">
              <h1 className="coac-vc__title">¿Quién canta hoy?</h1>
              <p className="coac-vc__phase">
                COAC {SEASON.year} · {SEASON.phaseTitle}
              </p>
            </div>
          </a>
          {/* Accesos rápidos (solo móvil): iconos con el nombre para lectores de pantalla */}
          <nav className="coac-vc__actions" aria-label="Accesos rápidos">
            <button type="button" className="coac-vc__action" onClick={goToSearch} title="Buscar">
              <SearchIcon />
              <span className="coac-sr-only">Buscar</span>
            </button>
            <a
              className="coac-vc__action"
              href={SEASON.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Ver el directo"
              data-live={p.live ? "" : undefined}
            >
              <LiveIcon />
              <span className="coac-sr-only">Ver el directo (se abre en otra pestaña)</span>
            </a>
            <button type="button" className="coac-vc__action" onClick={goToToday} title="Horario de hoy">
              <CalendarIcon />
              <span className="coac-sr-only">Horario de hoy</span>
            </button>
          </nav>
          {p.live && (
            <a className="coac-vc__live-strip" href={`#${p.live.group.id}`} onClick={goToLive}>
              <span className="coac-vc__live-dot" aria-hidden="true" />
              <span className="coac-vc__live-strip-label">En directo</span>
              <span className="coac-vc__live-strip-name">{p.live.group.autor}</span>
              <span className="coac-vc__live-strip-go">Ver</span>
            </a>
          )}
        </header>

        <aside className="coac-vc__side" aria-label="Buscador, estado y sesiones">
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
                <a className="coac-vc__now-link" href={`#${p.live.group.id}`} onClick={goToLive}>
                  Ver en el programa
                </a>
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
              <LiveIcon /> Ver el directo
            </a>
          </section>

          <nav className="coac-vc__calendar" aria-label="Sesiones de la fase">
            {(
              [
                ["Próximas sesiones", p.all.filter((session) => session.status !== "past")],
                ["Ya celebradas", p.all.filter((session) => session.status === "past")],
              ] as const
            ).map(
              ([heading, list]) =>
                list.length > 0 && (
                  <div key={heading} className="coac-vc__day-group">
                    <p className="coac-vc__heading">{heading}</p>
                    <ol className="coac-vc__days">
                      {list.map((session) => (
                        <li key={session.date}>
                          <button
                            type="button"
                            className="coac-vc__day"
                            data-status={session.status}
                            data-label={p.dayLabel(session) || undefined}
                            aria-pressed={p.mode === "day" && p.selectedDate === session.date}
                            onClick={() => {
                              p.reset();
                              p.setSelectedDate(session.date);
                            }}
                          >
                            <span className="coac-vc__day-name">{formatShortDate(session.date)}</span>
                            <span className="coac-vc__day-count">
                              {p.dayLabel(session) || `${session.performances.length} agrup.`}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </div>
                ),
            )}
          </nav>
        </aside>
      </div>

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

        {p.sections.length > 0 && (
          <p className="coac-vc__legend">
            <span className="coac-vc__legend-item" data-ranking="top">
              Imprescindible
            </span>
            <span className="coac-vc__legend-item" data-ranking="ok">
              Recomendada
            </span>
          </p>
        )}

        {p.sections.map(({ key, label, session, performances }) => (
          <section
            key={key}
            className="coac-vc__session"
            data-status={session.status}
            aria-labelledby={`vc-${key}`}
          >
            <header className="coac-vc__session-head">
              {label && (
                <span className="coac-vc__pill" data-label={label}>
                  {label}
                </span>
              )}
              <h2 id={`vc-${key}`} className="coac-vc__session-title" tabIndex={-1}>
                {formatSessionTitleDate(session.date)}
              </h2>
              <p className="coac-vc__session-meta">
                {session.performances.length} agrupaciones · {session.performances[0]?.estimatedTime}–
                {session.estimatedEndTime} aprox.
              </p>
            </header>
            <ol className="coac-vc__timeline">
              {performances.map((performance) => {
                const { group, estimatedTime } = performance;
                const stage = p.stageOf(session, performance);
                const isLive = stage === "live";
                return (
                  <li
                    key={group.id}
                    className="coac-vc__slot"
                    data-stage={stage}
                    data-live={isLive || undefined}
                  >
                    <p className="coac-vc__time">
                      {estimatedTime}
                      <span className="coac-vc__dot" aria-hidden="true" />
                    </p>
                    <article
                      className="coac-vc__card"
                      id={group.id}
                      tabIndex={-1}
                      data-ranking={group.ranking}
                    >
                      {isLive && (
                        <p className="coac-vc__live-bar">
                          <BroadcastIcon inline /> Actuando ahora
                          <span className="coac-vc__live-bar-time">
                            {estimatedTime}–{addMinutes(estimatedTime, SEASON.minutesPerGroup)} aprox.
                          </span>
                        </p>
                      )}
                      <p className="coac-vc__badges">
                        {session.status === "present" && (stage === "done" || stage === "next") && (
                          <span className="coac-vc__stage" data-stage={stage}>
                            {STAGE_LABEL[stage]}
                          </span>
                        )}
                        {/* El semáforo se ve en la franja de color; el texto, para lectores de pantalla */}
                        {RANKING_LABEL[group.ranking] && (
                          <span className="coac-sr-only">{RANKING_LABEL[group.ranking]}.</span>
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
                      {isLive && (
                        <span
                          className="coac-vc__progress"
                          aria-hidden="true"
                          style={{ "--vc-progress": p.liveProgress } as CSSProperties}
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
          <p className="coac-vc__empty">No hay nada con ese nombre. Prueba con otro.</p>
        )}

        <section className="coac-vc__print" aria-labelledby="vc-print-title">
          <div className="coac-vc__print-text">
            <h2 id="vc-print-title" className="coac-vc__print-title">
              Llévate el programa
            </h2>
            <p className="coac-vc__print-desc">
              Elige sesiones, modalidades y favoritas, y llévatelo en papel, en PDF o como imagen.
            </p>
          </div>
          <button
            type="button"
            className="coac-vc__print-button"
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

      <footer className="coac-vc__footer">
        <div className="coac-vc__footer-inner">
          <nav className="coac-vc__phases" aria-labelledby="vc-phases-title">
            <h2 id="vc-phases-title" className="coac-vc__footer-heading">
              Fases del COAC {SEASON.year}
            </h2>
            <ol className="coac-vc__phase-list">
              {PHASES.map((phase) => {
                const status = phaseStatus(phase, p.schedule.activeSessionDate);
                const content = (
                  <>
                    <span className="coac-vc__phase-name">{phase.short}</span>
                    <span className="coac-vc__phase-dates">{phase.dates}</span>
                    <span className="coac-vc__phase-state">{PHASE_STATUS_LABEL[status]}</span>
                  </>
                );
                const home = isHomePhase(phase);
                return (
                  <li key={phase.id}>
                    {home ? (
                      <a
                        className="coac-vc__phase-item"
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
                        className="coac-vc__phase-item"
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

          <div className="coac-vc__footer-theme">
            <ThemeModeSwitch />
          </div>
          <div className="coac-vc__footer-text">
            <p className="coac-vc__footer-pages">
              <button
                type="button"
                className="coac-vc__footer-page"
                aria-haspopup="dialog"
                onPointerEnter={loadAbout}
                onFocus={loadAbout}
                onClick={() => setAboutOpen(true)}
              >
                Quiénes somos
              </button>
              <a
                className="coac-vc__footer-page"
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
              <a className="coac-vc__footer-link" href="https://github.com/nandovejer/luz">
                Luz
              </a>{" "}
              por{" "}
              <a className="coac-vc__footer-link" href="https://twitter.com/nandovejer">
                Nando Muñoz
              </a>
              . Código abierto bajo{" "}
              <a className="coac-vc__footer-link" href="https://es.wikipedia.org/wiki/MIT_License">
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
