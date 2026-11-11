import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { SEASON } from "../config/season";
import { ThemeModeSwitch } from "../components/layout/ThemeModeSwitch";
import { FallaLogo } from "../components/ui/FallaLogo";
import {
  BroadcastIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  LiveIcon,
  PlayIcon,
  PrinterIcon,
  SearchIcon,
} from "../components/ui/icons";
import { formatSessionTitleDate, formatShortDate, parseSessionDate, sessionDateKey } from "../lib/dates";
import { ModalidadFilter, PreviousNote } from "./parts";
import { PHASE_STATUS_LABEL, PHASES, isHomePhase, phaseStatus } from "./phases";
import { PRIVACY_HASH } from "./privacy/policy";
import { sessionBrief } from "./sessionBrief";
import { ShellDialogs } from "./ShellDialogs";
import { addMinutes, pad2, useProgramme, useRemaining, type Stage } from "./useProgramme";
import { afterPaint, HOME_URL, useShell } from "./useShell";
import "./VariantE.css";

const RANKING_LABEL = { top: "Imprescindible", ok: "Recomendada", standar: "" } as const;
const STAGE_LABEL = { done: "Ya actuó", next: "A continuación" } as const;
const SEARCH_INPUT_ID = "ve-search";
/** Nombre corto de la fase en curso («Preliminares»), para la cabecera de móvil. */
const HOME_PHASE_SHORT = PHASES.find(isHomePhase)?.short ?? SEASON.phaseTitle;

/** Días de calendario de `from` a `to` (fechas `dd/mm/yyyy`); `null` si alguna no es válida. */
function daysBetween(from: string, to: string) {
  const a = parseSessionDate(from);
  const b = parseSessionDate(to);
  if (!a || !b) return null;
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86400000);
}

/** Cómo va la sesión de hoy, en una frase (la barra de segmentos dice lo mismo sin texto). */
function progressText(stages: Stage[]) {
  const done = stages.filter((stage) => stage === "done").length;
  if (done === stages.length) return "Ha terminado";
  if (done === 0 && !stages.includes("live")) return "Aún no ha empezado";
  return `${done} de ${stages.length} ya han actuado`;
}

/** Alto de la cabecera fija (solo en móvil; en escritorio no es fija y vale 0). */
function stickyHeaderHeight() {
  const header = document.querySelector<HTMLElement>(".coac-ve__top");
  return header && getComputedStyle(header).position === "sticky" ? header.offsetHeight : 0;
}

/**
 * Lleva `element` a lo alto de la pantalla, por debajo de lo que vaya fijo encima
 * (`extra`, p. ej. el buscador). Al bajar, la cabecera de móvil se esconde, así
 * que solo se descuenta al subir.
 */
function scrollUnderBars(element: HTMLElement, extra = 0) {
  const top = element.getBoundingClientRect().top + window.scrollY - extra;
  const header = top > window.scrollY ? 0 : stickyHeaderHeight();
  window.scrollTo({ top: top - header });
}

/** Sube el buscador justo bajo la cabecera fija (con el programa debajo) y le da el foco. */
function goToSearch() {
  const search = document.getElementById("searchAuthor");
  const input = document.getElementById(SEARCH_INPUT_ID);
  if (!search || !input) return;
  // El buscador es fijo: se mide su sitio en la página, el de la zona de horarios
  const zone = search.parentElement ?? search;
  scrollUnderBars(zone);
  input.focus({ preventScroll: true });
}

/** Baja al primer bloque del programa (hoy, o la próxima sesión) por debajo de la cabecera fija. */
function scrollToProgramme() {
  const session = document.querySelector<HTMLElement>(".coac-ve__session");
  if (!session) return;
  // Queda bajo la cabecera y el filtro, que van fijos sobre los horarios
  scrollUnderBars(session, filtersOffset());
  session.querySelector<HTMLElement>(".coac-ve__session-title")?.focus({ preventScroll: true });
}

/**
 * Publica en el elemento raíz el alto de la cabecera (`--ve-top-h`, cambia con la
 * tira «En directo») y el del filtro (`--ve-filters-h`): lo fijo se apila justo
 * debajo de lo anterior.
 */
function useStickyHeights() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    const header = root?.querySelector<HTMLElement>(".coac-ve__top");
    const filters = root?.querySelector<HTMLElement>(".coac-ve__filters");
    if (!root || !header || !filters) return;
    const update = () => {
      root.style.setProperty("--ve-top-h", `${stickyHeaderHeight()}px`);
      root.style.setProperty("--ve-filters-h", `${filters.offsetHeight}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    observer.observe(filters);
    return () => observer.disconnect();
  }, []);
  return rootRef;
}

/** Aire entre el filtro fijo y lo que se lleva a su borde (un día elegido, la sesión de hoy). */
const FILTERS_GAP = 16;

/** El bloque fijo sobre los horarios: buscador, modalidades y días. */
const getFilters = () => document.querySelector<HTMLElement>(".coac-ve__filters");

/**
 * Alto que hay que dejar libre bajo el filtro fijo. Vale su alto de ahora: si al
 * quedarse fijo encoge (pierde el título), lo de debajo sube lo mismo, porque el
 * filtro sigue ocupando su sitio en la página.
 */
const filtersOffset = () => (getFilters()?.offsetHeight ?? 0) + FILTERS_GAP;

/**
 * Marca el filtro con `data-stuck` mientras va fijo sobre los horarios (en
 * móvil, entonces el título del buscador se oculta para dejar más sitio). Toca
 * el DOM directamente: cambia con el scroll y no merece repintar la app.
 */
function useStuckFilters() {
  useEffect(() => {
    const filters = getFilters();
    const zone = document.querySelector<HTMLElement>(".coac-ve__programme");
    if (!filters || !zone) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // Va fijo cuando la zona de horarios ya ha pasado por debajo de su sitio fijo:
      // bajo la cabecera, o arriba del todo si la cabecera se ha escondido
      const hidden = filters.closest("[data-header-hidden]") !== null;
      const stuck = zone.getBoundingClientRect().top < (hidden ? 0 : stickyHeaderHeight()) - 1;
      filters.toggleAttribute("data-stuck", stuck);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
}

/** Tras elegir un día, deja su sesión justo bajo el filtro fijo, sin tener que buscarla. */
function showChosenDay() {
  const after = getFilters()?.nextElementSibling;
  if (after instanceof HTMLElement) scrollUnderBars(after, filtersOffset());
}

/**
 * En móvil, la cabecera fija se esconde al bajar y vuelve al subir (o al llegar
 * arriba). Marca la raíz con `data-header-hidden`; el CSS la desliza.
 */
function useHideHeaderOnScroll(rootRef: RefObject<HTMLDivElement>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const header = stickyHeaderHeight();
      if (header === 0 || y <= header) root.removeAttribute("data-header-hidden");
      else if (y > lastY + 4) root.setAttribute("data-header-hidden", "");
      else if (y < lastY - 4) root.removeAttribute("data-header-hidden");
      else return;
      lastY = y;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
    };
  }, [rootRef]);
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

  const scrollable = !(edges.start && edges.end);

  // Queda a la vista el día elegido, si no el de hoy, si no la próxima sesión (y
  // acabada la fase, la última): se mueve la tira, nunca la página. Se repite al
  // salir las flechas, que estrechan la tira.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const day =
      ['[aria-pressed="true"]', '[data-label="Hoy"]', "[data-upcoming]"]
        .map((selector) => list.querySelector<HTMLElement>(selector))
        .find(Boolean) ?? list.querySelector<HTMLElement>("li:last-child button");
    if (!day) return;
    const listBox = list.getBoundingClientRect();
    const dayBox = day.getBoundingClientRect();
    if (dayBox.left >= listBox.left && dayBox.right <= listBox.right) return;
    const left = dayBox.left - listBox.left + list.scrollLeft - (listBox.width - dayBox.width) / 2;
    list.scrollTo({ left, behavior: "instant" });
  }, [focusKey, scrollable]);

  // Casi una pantalla de días; la suavidad la pone el CSS (y se quita con «reducir movimiento»).
  const scrollBy = (direction: 1 | -1) => {
    const list = listRef.current;
    list?.scrollBy({ left: direction * list.clientWidth * 0.8 });
  };

  return (
    <div className="coac-ve__carousel" data-scrollable={scrollable || undefined}>
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
  const p = useProgramme({ allSessions: true });
  const shell = useShell(p);
  const upcoming = p.live ? null : p.schedule.upcomingSession;
  const remaining = useRemaining(upcoming?.startsAt);
  const state = p.live ? "live" : remaining ? "countdown" : "over";
  const rootRef = useStickyHeights();
  useHideHeaderOnScroll(rootRef);
  useStuckFilters();
  const inputRef = useRef<HTMLInputElement>(null);

  const clearTerm = () => {
    p.setTerm("");
    inputRef.current?.focus();
  };

  // Vuelve al programa de hoy (sin búsqueda ni día elegido) y baja hasta él.
  const goToToday = () => {
    p.reset();
    afterPaint(scrollToProgramme);
  };

  // Los accesos rápidos se pintan en dos sitios (cabecera de móvil y columna de
  // escritorio) y el CSS muestra solo uno: así el orden del foco sigue al visual.
  const renderActions = (place: "top" | "rail") => (
    <nav className="coac-ve__actions" data-place={place} aria-label="Accesos rápidos">
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
  );

  // El resumen de la columna: la sesión de hoy o, si no hay, la próxima
  const briefSession = p.schedule.present ?? p.schedule.upcomingSession;

  // La tira de días va en orden de fecha (las celebradas, con borde discontinuo)
  const days = [...p.all].sort((a, b) => sessionDateKey(a.date) - sessionDateKey(b.date));

  return (
    <div ref={rootRef} className="coac-ve" data-view={p.mode}>
      {/* En escritorio, columna izquierda fija; en móvil no pinta caja (display: contents)
          y la cabecera queda fija arriba de toda la página. */}
      <div className="coac-ve__rail coac-scrollbar">
        <header className="coac-ve__top">
          <div className="coac-ve__top-row">
            {/* Título y, debajo, la fase: una sola fila con los accesos, para una cabecera baja */}
            <a className="coac-ve__home" href={HOME_URL} onClick={shell.goHome}>
              <FallaLogo className="coac-ve__logo" />
              <span className="coac-ve__brand-text">
                <h1 className="coac-ve__title">¿Quién canta hoy?</h1>
                <span className="coac-ve__phase">
                  COAC {SEASON.year} · <span className="coac-ve__phase-short">{HOME_PHASE_SHORT}</span>
                  <span className="coac-ve__phase-full">{SEASON.phaseTitle}</span>
                </span>
              </span>
            </a>
            {/* Accesos rápidos en la cabecera fija de móvil: solo icono (con nombre para
                lectores de pantalla). En escritorio van bajo la tarjeta de estado. */}
            {renderActions("top")}
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

        <aside className="coac-ve__side" aria-label="Estado">
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
            {/* Qué no perderse de la sesión de hoy (o la próxima) */}
            {briefSession && (
              <div className="coac-ve__status-brief">
                <p className="coac-ve__status-brief-text">
                  {sessionBrief(briefSession).map((part, index) =>
                    part.strong ? (
                      <strong key={index}>{part.text}</strong>
                    ) : (
                      <span key={index}>{part.text}</span>
                    ),
                  )}
                </p>
                <button type="button" className="coac-ve__status-brief-link" onClick={goToToday}>
                  Ver la sesión
                  <ChevronRightIcon />
                </button>
              </div>
            )}
          </section>
        </aside>

        {renderActions("rail")}
      </div>

      <div className="coac-ve__body">
        <main id="siteMain" className="coac-ve__main">
          {/* La zona de horarios: el filtro (buscador y días) va fijo arriba mientras se
              recorre y se suelta al salir de ella (sticky dentro de este bloque) */}
          <div className="coac-ve__programme">
            {/* Justo encima de lo que filtra */}
            <div className="coac-ve__filters">
              <div className="coac-ve__search" id="searchAuthor" role="search">
                {/* A la vista solo en móvil; en escritorio la barra se explica sola */}
                <label
                  className="coac-ve__search-label coac-ve__eyebrow coac-ve__ruled"
                  htmlFor={SEARCH_INPUT_ID}
                >
                  Busca tu agrupación favorita
                  <span className="coac-sr-only"> por autor, autora o nombre</span>
                </label>
                <div className="coac-ve__field">
                  <SearchIcon />
                  <input
                    ref={inputRef}
                    id={SEARCH_INPUT_ID}
                    type="text"
                    enterKeyHint="search"
                    autoComplete="off"
                    placeholder="Busca autor, autora o agrupación"
                    value={p.term}
                    onChange={(event) => p.setTerm(event.target.value)}
                  />
                  {p.term && (
                    <button
                      type="button"
                      className="coac-ve__clear"
                      onClick={clearTerm}
                      title="Borrar búsqueda"
                    >
                      <CloseIcon />
                      <span className="coac-sr-only">Borrar búsqueda</span>
                    </button>
                  )}
                </div>
                <div
                  className="coac-ve__chips coac-scrollbar"
                  role="group"
                  aria-label="Filtrar por modalidad"
                >
                  <ModalidadFilter value={p.modalidad} onChange={p.setModalidad} className="coac-ve__chip" />
                </div>
              </div>

              {/* Los días, parte del filtro: al elegir uno, su sesión sale justo debajo */}
              <nav className="coac-ve__calendar" aria-label="Sesiones de la fase">
                <DayStrip focusKey={`${p.schedule.activeSessionDate}|${p.selectedDate}`}>
                  {days.map((session) => {
                    const [weekday, day] = formatShortDate(session.date).split(" ");
                    const label = p.dayLabel(session);
                    const chosen = p.mode === "day" && p.selectedDate === session.date;
                    return (
                      <li key={session.date}>
                        <button
                          type="button"
                          className="coac-ve__day"
                          data-status={session.status}
                          data-label={label || undefined}
                          data-upcoming={session.date === p.schedule.upcomingSession?.date || undefined}
                          aria-pressed={chosen}
                          onClick={() => {
                            // Pulsar otra vez el día elegido lo quita: vuelve todo el programa
                            p.reset();
                            if (!chosen) p.setSelectedDate(session.date);
                            afterPaint(showChosenDay);
                          }}
                        >
                          <span className="coac-sr-only">
                            {label && `${label}: `}
                            {formatSessionTitleDate(session.date)}, {session.performances.length} agrupaciones
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
              </nav>
            </div>

            {p.mode !== "focus" && (
              <p className="coac-ve__context" role="status">
                <span>
                  {p.mode === "search"
                    ? `${p.count} ${p.count === 1 ? "agrupación encontrada" : "agrupaciones encontradas"}`
                    : "Sesión elegida"}
                </span>
                <button type="button" className="coac-ve__reset" onClick={p.reset}>
                  Ver todo el programa
                </button>
              </p>
            )}

            {p.mode === "focus" && p.sections.length > 0 && (
              <p className="coac-ve__programme-label coac-ve__eyebrow coac-ve__ruled">Programa</p>
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
              {p.sections.map(({ key, label, session, performances }) => {
                // Jerarquía: hoy en bloque pleno; la próxima en bloque suave; el resto, solo el título
                const isNext =
                  session.status === "future" && session.date === p.schedule.upcomingSession?.date;
                const featured = session.status === "present" ? "today" : isNext ? "next" : undefined;
                const start = session.performances[0]?.estimatedTime;
                return (
                  <section
                    key={key}
                    className="coac-ve__session"
                    data-status={session.status}
                    data-featured={featured}
                    aria-labelledby={`ve-${key}`}
                  >
                    <header className="coac-ve__session-head">
                      {featured === "next" && <FallaLogo className="coac-ve__session-mark" />}
                      {featured === "next" ? (
                        <p className="coac-ve__session-eyebrow">
                          {label === "Mañana" ? "Mañana · Próxima sesión" : "Próxima sesión"}
                        </p>
                      ) : (
                        label && (
                          <span className="coac-ve__label" data-label={label}>
                            {label}
                          </span>
                        )
                      )}
                      <h2 id={`ve-${key}`} className="coac-ve__session-title" tabIndex={-1}>
                        {formatSessionTitleDate(session.date)}
                      </h2>
                      <p className="coac-ve__session-meta">
                        {session.performances.length} agrupaciones · {session.performances[0]?.estimatedTime}–
                        {session.estimatedEndTime} aprox.
                      </p>
                      {featured === "next" && (
                        <p className="coac-ve__session-when">
                          <CalendarIcon />
                          {(() => {
                            const days = daysBetween(p.schedule.activeSessionDate, session.date);
                            return days && days > 1
                              ? `Faltan ${days} días · a las ${start}`
                              : `Empieza a las ${start}`;
                          })()}
                        </p>
                      )}
                      {session.status === "present" &&
                        (() => {
                          // Un segmento por agrupación de la sesión entera (también al buscar)
                          const stages = session.performances.map((performance) =>
                            p.stageOf(session, performance),
                          );
                          return (
                            <p className="coac-ve__session-progress">
                              <span className="coac-ve__segments" aria-hidden="true">
                                {stages.map((stage, index) => (
                                  <span key={index} className="coac-ve__segment" data-stage={stage} />
                                ))}
                              </span>
                              <span className="coac-ve__session-progress-text">{progressText(stages)}</span>
                            </p>
                          );
                        })()}
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
                );
              })}
            </div>

            {p.sections.length === 0 && (
              <p className="coac-ve__empty">No hay nada con ese nombre. Prueba con otro.</p>
            )}
          </div>

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
