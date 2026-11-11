import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { SEASON } from "../config/season";
import { ThemeModeSwitch } from "../components/layout/ThemeModeSwitch";
import { FallaLogo } from "../components/ui/FallaLogo";
import {
  BroadcastIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LiveIcon,
  PlayIcon,
  PrinterIcon,
  SearchIcon,
} from "../components/ui/icons";
import { formatSessionTitleDate, formatShortDate } from "../lib/dates";
import { ModalidadFilter, PreviousNote } from "./parts";
import { PHASE_STATUS_LABEL, PHASES, isHomePhase, phaseStatus } from "./phases";
import { PRIVACY_HASH } from "./privacy/policy";
import { ShellDialogs } from "./ShellDialogs";
import { addMinutes, pad2, useProgramme, useRemaining } from "./useProgramme";
import { afterPaint, HOME_URL, useShell } from "./useShell";
import "./VariantE.css";

const RANKING_LABEL = { top: "Imprescindible", ok: "Recomendada", standar: "" } as const;
const STAGE_LABEL = { done: "Ya actuó", next: "A continuación" } as const;
const SEARCH_INPUT_ID = "ve-search";

/** Lleva al buscador (desde la cabecera fija en móvil) y le da el foco. */
function goToSearch() {
  const input = document.getElementById(SEARCH_INPUT_ID);
  if (!input) return;
  input.scrollIntoView({ block: "center" });
  input.focus({ preventScroll: true });
}

/** Baja al primer bloque del programa (hoy, o la próxima sesión) por debajo de la cabecera fija. */
function scrollToProgramme() {
  const session = document.querySelector<HTMLElement>(".coac-ve__session");
  if (!session) return;
  const header = document.querySelector<HTMLElement>(".coac-ve__top");
  const offset = header && getComputedStyle(header).position === "sticky" ? header.offsetHeight : 0;
  window.scrollTo({ top: session.getBoundingClientRect().top + window.scrollY - offset });
  session.querySelector<HTMLElement>(".coac-ve__session-title")?.focus({ preventScroll: true });
}

/**
 * Tira de días: siempre una sola fila que se desliza (con el dedo, encajando
 * en cada día) y flechas a los lados, que se apagan en los extremos y no salen
 * si todo cabe. `focusKey` cambia cuando cambia el día que debe quedar a la vista.
 */
function DayStrip({ focusKey, children }: { focusKey: string; children: ReactNode }) {
  const listId = useId();
  const listRef = useRef<HTMLOListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const max = list.scrollWidth - list.clientWidth;
    setEdges({ start: list.scrollLeft <= 1, end: list.scrollLeft >= max - 1 });
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    update();
    list.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => {
      list.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [update]);

  // El día elegido (o el de hoy) queda a la vista: se mueve la tira, nunca la página.
  useEffect(() => {
    const list = listRef.current;
    const day = list?.querySelector<HTMLElement>('[aria-pressed="true"], [data-label="Hoy"]');
    if (!list || !day) return;
    const listBox = list.getBoundingClientRect();
    const dayBox = day.getBoundingClientRect();
    if (dayBox.left >= listBox.left && dayBox.right <= listBox.right) return;
    const left = dayBox.left - listBox.left + list.scrollLeft - (listBox.width - dayBox.width) / 2;
    list.scrollTo({ left, behavior: "instant" });
  }, [focusKey]);

  // Casi una pantalla de días; la suavidad la pone el CSS (y se quita con «reducir movimiento»).
  const scrollBy = (direction: 1 | -1) => {
    const list = listRef.current;
    list?.scrollBy({ left: direction * list.clientWidth * 0.8 });
  };

  return (
    <div className="coac-ve__carousel" data-scrollable={!(edges.start && edges.end) || undefined}>
      <button
        type="button"
        className="coac-ve__arrow"
        aria-controls={listId}
        disabled={edges.start}
        onClick={() => scrollBy(-1)}
      >
        <ChevronLeftIcon />
        <span className="coac-sr-only">Días anteriores</span>
      </button>
      <ol id={listId} ref={listRef} className="coac-ve__days">
        {children}
      </ol>
      <button
        type="button"
        className="coac-ve__arrow"
        aria-controls={listId}
        disabled={edges.end}
        onClick={() => scrollBy(1)}
      >
        <ChevronRightIcon />
        <span className="coac-sr-only">Días siguientes</span>
      </button>
    </div>
  );
}

/**
 * Variante E · «Cartelera»: app de eventos clara y suave. Tarjetas blancas
 * sobre gris claro, una tarjeta de estado a color pleno (cobalto), los días
 * como números grandes con el elegido en una ficha elevada, y el programa
 * con la franja horaria escrita en vertical junto a cada tarjeta.
 */
export default function VariantE() {
  const p = useProgramme();
  const shell = useShell(p);
  const upcoming = p.live ? null : p.schedule.upcomingSession;
  const remaining = useRemaining(upcoming?.startsAt);
  const state = p.live ? "live" : remaining ? "countdown" : "over";

  // Vuelve al programa de hoy (sin búsqueda ni día elegido) y baja hasta él.
  const goToToday = () => {
    p.reset();
    afterPaint(scrollToProgramme);
  };

  const dayGroups = [
    ["Próximas sesiones", p.all.filter((session) => session.status !== "past")],
    ["Ya celebradas", p.all.filter((session) => session.status === "past")],
  ] as const;

  return (
    <div className="coac-ve" data-view={p.mode}>
      {/* En escritorio, columna izquierda fija; en móvil no pinta caja (display: contents)
          y la cabecera queda fija arriba de toda la página. */}
      <div className="coac-ve__rail coac-scrollbar">
        <header className="coac-ve__top">
          <div className="coac-ve__top-row">
            <p className="coac-ve__eyebrow coac-ve__phase">
              COAC {SEASON.year} · {SEASON.phaseTitle}
            </p>
            <a className="coac-ve__home" href={HOME_URL} onClick={shell.goHome}>
              <FallaLogo className="coac-ve__logo" />
              <h1 className="coac-ve__title">¿Quién canta hoy?</h1>
            </a>
            {/* Accesos rápidos: solo icono en móvil (con nombre para lectores de pantalla),
                con su texto en la columna de escritorio */}
            <nav className="coac-ve__actions" aria-label="Accesos rápidos">
              <button type="button" className="coac-ve__action" onClick={goToSearch} title="Buscar">
                <SearchIcon />
                <span className="coac-ve__action-label">Buscar</span>
              </button>
              <button type="button" className="coac-ve__action" onClick={goToToday} title="Sesión de hoy">
                <CalendarIcon />
                <span className="coac-ve__action-label">Sesión de hoy</span>
              </button>
              <a
                className="coac-ve__action"
                href={SEASON.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Ver el directo"
                data-live={p.live ? "" : undefined}
              >
                <LiveIcon />
                <span className="coac-ve__action-label">Ver el directo</span>
                <span className="coac-sr-only"> (se abre en otra pestaña)</span>
              </a>
            </nav>
          </div>
          {p.live && (
            <a className="coac-ve__strip" href={`#${p.live.group.id}`} onClick={shell.goToLive}>
              <span className="coac-ve__on-air">
                <span className="coac-ve__on-air-dot" aria-hidden="true" />
                En directo
              </span>
              <span className="coac-ve__strip-name">{p.live.group.autor}</span>
              <span className="coac-ve__strip-go">
                Ver
                <ChevronRightIcon />
              </span>
            </a>
          )}
        </header>

        <aside className="coac-ve__side" aria-label="Estado, buscador y sesiones">
          <section className="coac-ve__status" data-state={state} aria-label="Estado">
            <FallaLogo className="coac-ve__status-mark" />
            {p.live ? (
              <>
                <p className="coac-ve__on-air">
                  <BroadcastIcon inline /> En directo
                </p>
                <p className="coac-ve__status-title">{p.live.group.autor}</p>
                <p className="coac-ve__status-sub">
                  {p.live.group.nombre} · {p.live.estimatedTime}–
                  {addMinutes(p.live.estimatedTime, SEASON.minutesPerGroup)} aprox.
                </p>
              </>
            ) : remaining && upcoming ? (
              <>
                <p className="coac-ve__eyebrow">Próxima sesión</p>
                <p className="coac-ve__status-title">{formatSessionTitleDate(upcoming.date)}</p>
                <div className="coac-ve__digits" aria-hidden="true">
                  {(
                    [
                      [remaining.days, "días"],
                      [remaining.hours, "horas"],
                      [remaining.minutes, "min"],
                      [remaining.seconds, "seg"],
                    ] as const
                  ).map(([value, unit]) => (
                    <span key={unit} className="coac-ve__digit">
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
              <>
                <p className="coac-ve__eyebrow">COAC {SEASON.year}</p>
                <p className="coac-ve__status-title">La fase ha terminado</p>
              </>
            )}
            <p className="coac-ve__status-actions">
              {p.live && (
                <a className="coac-ve__pill-button" href={`#${p.live.group.id}`} onClick={shell.goToLive}>
                  Ver en el programa
                </a>
              )}
              <a
                className="coac-ve__pill-button"
                data-quiet={p.live ? "" : undefined}
                href={SEASON.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LiveIcon /> Ver el directo
                <span className="coac-sr-only"> (se abre en otra pestaña)</span>
              </a>
            </p>
          </section>

          <div className="coac-ve__search" id="searchAuthor">
            <label className="coac-sr-only" htmlFor={SEARCH_INPUT_ID}>
              Buscar autor, autora o agrupación
            </label>
            <div className="coac-ve__field">
              <SearchIcon />
              <input
                id={SEARCH_INPUT_ID}
                type="text"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="Busca autor, autora o agrupación"
                value={p.term}
                onChange={(event) => p.setTerm(event.target.value)}
              />
            </div>
            <div className="coac-ve__chips" role="group" aria-label="Filtrar por modalidad">
              <ModalidadFilter value={p.modalidad} onChange={p.setModalidad} className="coac-ve__chip" />
            </div>
          </div>

          <nav className="coac-ve__calendar" aria-label="Sesiones de la fase">
            {dayGroups.map(
              ([heading, list], index) =>
                list.length > 0 && (
                  <div key={heading} className="coac-ve__day-group">
                    <p className="coac-ve__day-heading">
                      <span className="coac-ve__eyebrow">{heading}</span>
                      {index === 0 && p.mode === "day" && (
                        <button type="button" className="coac-ve__text-button" onClick={p.reset}>
                          Hoy y mañana
                        </button>
                      )}
                    </p>
                    <DayStrip focusKey={`${p.schedule.activeSessionDate}|${p.selectedDate}`}>
                      {list.map((session) => {
                        const [weekday, day] = formatShortDate(session.date).split(" ");
                        const label = p.dayLabel(session);
                        return (
                          <li key={session.date}>
                            <button
                              type="button"
                              className="coac-ve__day"
                              data-status={session.status}
                              data-label={label || undefined}
                              aria-pressed={p.mode === "day" && p.selectedDate === session.date}
                              onClick={() => {
                                p.reset();
                                p.setSelectedDate(session.date);
                              }}
                            >
                              <span className="coac-sr-only">
                                {label && `${label}: `}
                                {formatSessionTitleDate(session.date)}, {session.performances.length}{" "}
                                agrupaciones
                              </span>
                              <span className="coac-ve__day-tag" aria-hidden="true">
                                {label === "Hoy" || label === "Mañana" ? label : ""}
                              </span>
                              <span className="coac-ve__day-num" aria-hidden="true">
                                {day}
                              </span>
                              <span className="coac-ve__day-week" aria-hidden="true">
                                {weekday}
                              </span>
                              <span className="coac-ve__day-dots" aria-hidden="true" />
                            </button>
                          </li>
                        );
                      })}
                    </DayStrip>
                  </div>
                ),
            )}
          </nav>
        </aside>
      </div>

      <div className="coac-ve__body">
        <main id="siteMain" className="coac-ve__main">
          {p.mode !== "focus" && (
            <p className="coac-ve__context" role="status">
              <span>
                {p.mode === "search"
                  ? `${p.count} ${p.count === 1 ? "agrupación encontrada" : "agrupaciones encontradas"}`
                  : "Sesión elegida"}
              </span>
              <button type="button" className="coac-ve__reset" onClick={p.reset}>
                Volver a hoy y mañana
              </button>
            </p>
          )}

          {p.sections.length > 0 && (
            <p className="coac-ve__legend">
              <span className="coac-ve__legend-item" data-ranking="top">
                Imprescindible
              </span>
              <span className="coac-ve__legend-item" data-ranking="ok">
                Recomendada
              </span>
            </p>
          )}

          <div className="coac-ve__sessions">
            {p.sections.map(({ key, label, session, performances }) => (
              <section
                key={key}
                className="coac-ve__session"
                data-status={session.status}
                aria-labelledby={`ve-${key}`}
              >
                <header className="coac-ve__session-head">
                  {label && (
                    <span className="coac-ve__label" data-label={label}>
                      {label}
                    </span>
                  )}
                  <h2 id={`ve-${key}`} className="coac-ve__session-title" tabIndex={-1}>
                    {formatSessionTitleDate(session.date)}
                  </h2>
                  <p className="coac-ve__session-meta">
                    {session.performances.length} agrupaciones · {session.performances[0]?.estimatedTime}–
                    {session.estimatedEndTime} aprox.
                  </p>
                </header>
                <ol className="coac-ve__slots">
                  {performances.map((performance) => {
                    const { group, estimatedTime } = performance;
                    const stage = p.stageOf(session, performance);
                    const isLive = stage === "live";
                    const endTime = addMinutes(estimatedTime, SEASON.minutesPerGroup);
                    return (
                      <li key={group.id} className="coac-ve__slot" data-stage={stage}>
                        {/* La franja horaria, escrita en vertical como en una agenda */}
                        <p className="coac-ve__time">
                          <span className="coac-sr-only">Hora estimada: </span>
                          {estimatedTime} — {endTime}
                        </p>
                        <article
                          className="coac-ve__card"
                          id={group.id}
                          tabIndex={-1}
                          data-ranking={group.ranking}
                          data-stage={stage}
                        >
                          {isLive && (
                            <p className="coac-ve__live-bar">
                              <span className="coac-ve__on-air">
                                <BroadcastIcon inline /> Actuando ahora
                              </span>
                              <span className="coac-ve__live-time">
                                {estimatedTime}–{endTime} aprox.
                              </span>
                            </p>
                          )}
                          <p className="coac-ve__badges">
                            {session.status === "present" && (stage === "done" || stage === "next") && (
                              <span className="coac-ve__stage" data-stage={stage}>
                                {STAGE_LABEL[stage]}
                              </span>
                            )}
                            {/* El semáforo se ve en la franja de color; el texto, para lectores de pantalla */}
                            {RANKING_LABEL[group.ranking] && (
                              <span className="coac-sr-only">{RANKING_LABEL[group.ranking]}.</span>
                            )}
                            <span className="coac-ve__badge" data-modalidad={group.modalidad}>
                              {group.modalidad.charAt(0) + group.modalidad.slice(1).toLowerCase()}
                            </span>
                            <span className="coac-ve__city">{group.ciudad}</span>
                          </p>
                          <h3 className="coac-ve__author">{group.autor}</h3>
                          <p className="coac-ve__name">{group.nombre}</p>
                          {group.previous && (
                            // El icono es parte del enlace al vídeo (su ::after cubre toda la fila)
                            <p
                              className="coac-ve__previous-row"
                              data-link={"name" in group.previous || undefined}
                            >
                              {"name" in group.previous && <PlayIcon inline />}
                              <PreviousNote previous={group.previous} className="coac-ve__previous" />
                            </p>
                          )}
                          {isLive && (
                            <span
                              className="coac-ve__progress"
                              aria-hidden="true"
                              style={{ "--ve-progress": p.liveProgress } as CSSProperties}
                            />
                          )}
                        </article>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>

          {p.sections.length === 0 && (
            <p className="coac-ve__empty">No hay nada con ese nombre. Prueba con otro.</p>
          )}

          <section className="coac-ve__print" aria-labelledby="ve-print-title">
            <div className="coac-ve__print-text">
              <p className="coac-ve__eyebrow">Para el teatro o el sofá</p>
              <h2 id="ve-print-title" className="coac-ve__print-title">
                Llévate el programa
              </h2>
              <p className="coac-ve__print-desc">
                Elige sesiones, modalidades y favoritas, y llévatelo en papel, en PDF o como imagen.
              </p>
            </div>
            <button type="button" className="coac-ve__print-button" {...shell.printButton}>
              <PrinterIcon />
              Imprime tu horario
            </button>
          </section>
        </main>

        <footer className="coac-ve__footer">
          <nav className="coac-ve__phases" aria-labelledby="ve-phases-title">
            <h2 id="ve-phases-title" className="coac-ve__eyebrow">
              Fases del COAC {SEASON.year}
            </h2>
            <ol className="coac-ve__phase-list">
              {PHASES.map((phase) => {
                const status = phaseStatus(phase, p.schedule.activeSessionDate);
                const content = (
                  <>
                    <span className="coac-ve__phase-state">{PHASE_STATUS_LABEL[status]}</span>
                    <span className="coac-ve__phase-name">{phase.short}</span>
                    <span className="coac-ve__phase-dates">{phase.dates}</span>
                  </>
                );
                return (
                  <li key={phase.id}>
                    {isHomePhase(phase) ? (
                      <a
                        className="coac-ve__phase-item"
                        data-status={status}
                        data-home
                        href={HOME_URL}
                        aria-current="page"
                        onClick={shell.goHome}
                      >
                        {content}
                      </a>
                    ) : (
                      // Aún no se pueden abrir: enlace desactivado (ver phases.ts)
                      <span
                        className="coac-ve__phase-item"
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

          <div className="coac-ve__footer-row">
            <div className="coac-ve__footer-theme">
              <ThemeModeSwitch />
            </div>
            <p className="coac-ve__footer-pages">
              <button type="button" className="coac-ve__footer-page" {...shell.aboutButton}>
                Quiénes somos
              </button>
              <a className="coac-ve__footer-page" href={PRIVACY_HASH} {...shell.privacyLink}>
                Privacidad
              </a>
            </p>
          </div>
          <div className="coac-ve__footer-text">
            <p>Horas estimadas: {SEASON.minutesPerGroup} min por agrupación, con actuación y montaje.</p>
            <p>
              Hecho con{" "}
              <a className="coac-ve__footer-link" href="https://github.com/nandovejer/luz">
                Luz
              </a>{" "}
              por{" "}
              <a className="coac-ve__footer-link" href="https://twitter.com/nandovejer">
                Nando Muñoz
              </a>
              . Código abierto bajo{" "}
              <a className="coac-ve__footer-link" href="https://es.wikipedia.org/wiki/MIT_License">
                licencia MIT
              </a>
              .
            </p>
          </div>
        </footer>
      </div>

      <ShellDialogs shell={shell} />
    </div>
  );
}
