import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { SEASON } from "../config/season";
import { Countdown } from "../components/status/Countdown";
import { usePrerender } from "./prerenderContext";
import { animateOnce, prefersReducedMotion, willAnimateChange, withViewTransition } from "../lib/motion";
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
import {
  formatSessionTitleDate,
  formatShortDate,
  parseSessionDate,
  sessionDateKey,
  sessionIsoDate,
} from "../lib/dates";
import { ModalidadFilter } from "../components/filters/ModalidadFilter";
import { PreviousNote } from "../components/programme/PreviousNote";
import { PHASE_STATUS_LABEL, PHASES, isHomePhase, phaseStatus } from "../domain/phases";
import { PRIVACY_HASH } from "../dialogs/privacy/policy";
import { sessionBrief } from "../domain/sessionBrief";
import { useGhostMark } from "../hooks/useGhostMark";
import { AppDialogs } from "./AppDialogs";
import type { PerformanceView } from "../domain/schedule";
import { addMinutes, useProgramme, type Stage } from "./useProgramme";
import { useReached } from "../hooks/useReached";
import { HOME_URL, useShell } from "./useShell";
import "./App.css";

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

/**
 * Una actuación del programa: la franja horaria y la tarjeta. Con props primitivas y
 * `memo`, escribir en el buscador o cambiar de modalidad solo repinta las tarjetas que
 * cambian, no las que se quedan. `liveProgress` solo llega a la que está en directo
 * (en las demás vale 0), para que el avance del turno no repinte el programa entero.
 */
const Slot = memo(function Slot({
  group,
  estimatedTime,
  stage,
  present,
  liveProgress,
}: {
  group: PerformanceView["group"];
  estimatedTime: string;
  stage: Stage;
  /** Si es la sesión de hoy (las demás no llevan «Ya actuó» ni «A continuación»). */
  present: boolean;
  liveProgress: number;
}) {
  const isLive = stage === "live";
  const endTime = addMinutes(estimatedTime, SEASON.minutesPerGroup);
  return (
    <li className="coac-ve__slot" data-stage={stage}>
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
          {present && (stage === "done" || stage === "next") && (
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
        <h3 className="coac-ve__name">{group.nombre}</h3>
        <p className="coac-ve__author">{group.autor}</p>
        {group.previous && (
          // El icono es parte del enlace al vídeo (su ::after cubre toda la fila)
          <p className="coac-ve__previous-row" data-link={"name" in group.previous || undefined}>
            {"name" in group.previous && <PlayIcon inline />}
            <PreviousNote previous={group.previous} className="coac-ve__previous" />
          </p>
        )}
        {isLive && (
          <span
            className="coac-ve__progress"
            aria-hidden="true"
            style={{ "--ve-progress": liveProgress } as CSSProperties}
          />
        )}
      </article>
    </li>
  );
});

/** `useLayoutEffect` no existe en el servidor (el prerender): allí no hace nada. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Desde este ancho la cabecera deja de ser fija (la columna izquierda ocupa su sitio). */
const DESKTOP_QUERY = "(min-width: 64rem)";

/**
 * Alto de la cabecera fija (solo en móvil; en escritorio no es fija y vale 0).
 * Se decide con la media query y no con `getComputedStyle`, que obligaría a
 * recalcular los estilos de toda la página en cada llamada.
 */
function stickyHeaderHeight() {
  const header = document.querySelector<HTMLElement>(".coac-ve__top");
  return header && !window.matchMedia(DESKTOP_QUERY).matches ? header.offsetHeight : 0;
}

/**
 * Lleva `element` a lo alto de la pantalla, por debajo de lo que vaya fijo encima
 * (`extra`, p. ej. el buscador). Al bajar, la cabecera de móvil se esconde, así
 * que solo se descuenta al subir.
 */
function scrollUnderBars(element: HTMLElement, extra = 0, instant = false) {
  const top = element.getBoundingClientRect().top + window.scrollY - extra;
  const header = top > window.scrollY ? 0 : stickyHeaderHeight();
  // Luz pone `scroll-behavior: smooth` en <html>; dentro de una View Transition el
  // salto es instantáneo (el telón lo tapa) y no un desplazamiento a cámara lenta
  window.scrollTo({ top: top - header, behavior: instant ? "instant" : "auto" });
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
function scrollToProgramme(instant = false) {
  const session = document.querySelector<HTMLElement>(".coac-ve__session");
  if (!session) return;
  // Queda bajo la cabecera y el filtro, que van fijos sobre los horarios
  scrollUnderBars(session, filtersOffset(), instant);
  session.querySelector<HTMLElement>(".coac-ve__session-title")?.focus({ preventScroll: true });
}

/**
 * Publica el alto de la cabecera (`--ve-top-h`, cambia con la tira «En directo»)
 * y el del filtro (`--ve-filters-h`): lo fijo se apila justo debajo de lo
 * anterior. Cada medida se escribe en el elemento que la usa (el filtro y la
 * lista de sesiones), no en un ancestro común: así un cambio solo invalida el
 * estilo de esos subárboles. El `scroll-padding` de la página (para que nada
 * enfocado quede bajo la cabecera ni el filtro) se pone directo en <html>.
 * Siempre se lee todo primero y se escribe después, y solo lo que cambia.
 */
function useStickyHeights() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    const header = root?.querySelector<HTMLElement>(".coac-ve__top");
    const filters = root?.querySelector<HTMLElement>(".coac-ve__filters");
    const sessions = root?.querySelector<HTMLElement>(".coac-ve__sessions");
    if (!root || !header || !filters || !sessions) return;
    const html = document.documentElement;
    let top = -1;
    let filtersHeight = -1;
    const update = () => {
      const nextTop = stickyHeaderHeight();
      const nextFilters = filters.offsetHeight;
      if (nextTop !== top) filters.style.setProperty("--ve-top-h", `${nextTop}px`);
      if (nextFilters !== filtersHeight) sessions.style.setProperty("--ve-filters-h", `${nextFilters}px`);
      if (nextTop !== top || nextFilters !== filtersHeight) {
        html.style.scrollPaddingBlockStart = `${nextTop + nextFilters + 16}px`;
      }
      top = nextTop;
      filtersHeight = nextFilters;
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    observer.observe(filters);
    return () => {
      observer.disconnect();
      filters.style.removeProperty("--ve-top-h");
      sessions.style.removeProperty("--ve-filters-h");
      html.style.removeProperty("scroll-padding-block-start");
    };
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
    // La primera medida va en el siguiente fotograma: así no fuerza un recálculo
    // de estilos entre las escrituras de los demás efectos
    schedule();
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
function showChosenDay(instant = false) {
  const after = getFilters()?.nextElementSibling;
  if (after instanceof HTMLElement) scrollUnderBars(after, filtersOffset(), instant);
}

/**
 * En móvil, la cabecera fija se esconde al bajar y vuelve al subir (o al llegar
 * arriba). Marca la raíz con `data-header-hidden`; el CSS la desliza.
 */
function useHideHeaderOnScroll(rootRef: RefObject<HTMLDivElement>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // `scrollY` obliga a recalcular el diseño: la primera lectura espera al fotograma
    let lastY = 0;
    let frame = requestAnimationFrame(() => {
      frame = 0;
      lastY = window.scrollY;
    });
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
 * Marca las filas (hora + tarjeta) que se ven bajo el filtro, como mucho 12: solo
 * ellas viajan en la View Transition del filtro de modalidad (un nombre por fila
 * en todo el programa serían cientos de capturas). Las que cortan con el filtro
 * no se marcan, para que nunca pasen por encima de él.
 */
function markVisibleSlots() {
  const top = getFilters()?.getBoundingClientRect().bottom ?? 0;
  let marked = 0;
  for (const slot of document.querySelectorAll<HTMLElement>(".coac-ve__slot")) {
    const box = slot.getBoundingClientRect();
    if (box.top < top - 1) continue;
    if (box.top > window.innerHeight || marked >= 12) break;
    slot.setAttribute("data-vt-card", "");
    marked++;
  }
}

interface LuzThemeModeElement extends HTMLElement {
  choice: string;
}

/**
 * Luces de sala: al pulsar el botón del modo de color, el modo nuevo se abre
 * como un círculo desde el botón (View Transition). Usa la API pública de Luz
 * (el setter `choice`, que guarda la elección y avisa a los lectores de pantalla)
 * en vez de reenviar el clic. Sin soporte o con «reducir movimiento», no
 * interviene y el botón de Luz funciona como siempre.
 */
function useThemeCurtain() {
  useEffect(() => {
    const host = document.querySelector<HTMLElement>(".coac-ve__footer-theme");
    if (!host) return;
    const onClick = (event: MouseEvent) => {
      const button = (event.target as Element).closest<HTMLElement>(".luz-theme-mode__button");
      const element = host.querySelector<LuzThemeModeElement>("luz-theme-mode");
      if (!button || !element || prefersReducedMotion() || !("startViewTransition" in document)) return;
      const values = [...element.querySelectorAll<HTMLInputElement>("input[type=radio]")]
        .filter((radio) => !radio.disabled)
        .map((radio) => radio.value);
      if (values.length === 0) return;
      // El ciclo es el de Luz: el siguiente radio del DOM, dando la vuelta
      const next = values[(values.indexOf(element.choice) + 1) % values.length];
      event.stopImmediatePropagation();
      const box = button.getBoundingClientRect();
      const html = document.documentElement;
      html.style.setProperty("--vt-x", `${box.left + box.width / 2}px`);
      html.style.setProperty("--vt-y", `${box.top + box.height / 2}px`);
      withViewTransition({
        change: () => {
          element.choice = next;
        },
        types: ["ve-theme"],
      });
    };
    host.addEventListener("click", onClick, true);
    return () => host.removeEventListener("click", onClick, true);
  }, []);
}

/** Si la tira de días está en su extremo izquierdo y en el derecho (los dos, si todo cabe). */
function edgesOf(list: HTMLElement) {
  const max = list.scrollWidth - list.clientWidth;
  return { start: list.scrollLeft <= 1, end: list.scrollLeft >= max - 1 };
}

/**
 * Tira de días: siempre una sola fila que se desliza (con el dedo, encajando
 * en cada día) y flechas a los lados, que se apagan en los extremos y no salen
 * si todo cabe. `focusKey` cambia cuando cambia el día que debe quedar a la vista.
 */
function DayStrip({ focusKey, children }: { focusKey: string; children: ReactNode }) {
  const listId = useId();
  const listRef = useRef<HTMLOListElement>(null);
  // En el HTML prerenderizado la tira sale con flechas (empieza en su extremo, con más
  // a la derecha) y un script en línea las quita si todo cabe. React parte de lo que ya
  // hay pintado, así que montar no cambia las flechas ni repite la medida. Sin HTML
  // previo (desarrollo), sin flechas hasta medir, antes del primer pintado.
  const [edges, setEdges] = useState(() => {
    if (typeof window === "undefined") return { start: true, end: false };
    const painted = document.querySelector<HTMLElement>(".coac-ve__days");
    return painted ? edgesOf(painted) : { start: true, end: true };
  });

  const update = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const next = edgesOf(list);
    // Sin cambio no hay nuevo estado: el scroll de la tira no repinta la app
    setEdges((previous) => (previous.start === next.start && previous.end === next.end ? previous : next));
  }, []);

  // La primera medida, antes del primer pintado: las flechas no aparecen tarde
  useIsomorphicLayoutEffect(update, [update]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
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
 * Entrada de la primera carga: solo si no hay ancla en la URL, la página está
 * arriba, es la primera vez en esta pestaña y no se pide «reducir movimiento».
 * La decide un script en línea del <head> (`vite-plugin-seo.ts`) antes del primer
 * pintado y la deja en `<html data-intro>`: así la fachada del HTML prerenderizado
 * ya espera en su pose inicial y la animación empieza donde estaba. Solo mueve
 * piezas decorativas (la fachada, los segmentos de hoy): el contenido y el LCP no
 * cambian.
 */
function introDecided() {
  return typeof document !== "undefined" && document.documentElement.hasAttribute("data-intro");
}

/**
 * La app · «Cartelera»: app de eventos clara y suave. Tarjetas blancas
 * sobre gris claro, una tarjeta de estado a color pleno (cobalto), los días
 * como números grandes con el elegido en una ficha elevada, y el programa
 * con la franja horaria escrita en vertical junto a cada tarjeta.
 */
export default function App({
  initialTerm = "",
  restoreSearchFocus = false,
}: {
  /** Lo escrito en el buscador del HTML prerenderizado antes de que cargara la app. */
  initialTerm?: string;
  restoreSearchFocus?: boolean;
} = {}) {
  const prerender = usePrerender();
  const p = useProgramme({ allSessions: true, initialTerm });
  const shell = useShell(p);
  const upcoming = p.live ? null : p.schedule.upcomingSession;
  // Entre la hora de inicio y el siguiente refresco (hasta 30 s) no hay cuenta
  // atrás ni directo: la sesión «empieza», no «ha terminado la fase»
  const reached = useReached(upcoming?.startsAt);
  const state = p.live ? "live" : upcoming ? (reached && !prerender ? "starting" : "countdown") : "over";
  const rootRef = useStickyHeights();
  useHideHeaderOnScroll(rootRef);
  useStuckFilters();
  useThemeCurtain();
  // Con un ancla (`#dd/mm/yyyy`, una agrupación), el navegador ya fue al HTML estático con
  // el margen de partida (y suave, como todo en esta página): al montar se recoloca en seco
  // con la cabecera y el filtro reales.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    const frame = requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: "instant" }));
    return () => cancelAnimationFrame(frame);
  }, []);
  const [intro, setIntro] = useState(introDecided);
  useEffect(() => {
    // La decisión ya está tomada y vive en `data-intro` de la raíz: <html> la suelta
    document.documentElement.removeAttribute("data-intro");
    try {
      window.sessionStorage.setItem("ve-intro", "1");
    } catch {
      // Sin almacenamiento, la entrada se repite en cada carga: no pasa nada
    }
    if (!intro) return;
    // Pasada la entrada se quita: si no, los segmentos que se vuelven a pintar la repetirían
    const timer = setTimeout(() => setIntro(false), 1400);
    return () => clearTimeout(timer);
  }, [intro]);
  useGhostMark(".coac-ve__carousel", ".coac-ve__days", ".coac-ve__day", "day");
  useGhostMark(".coac-ve__chips", ".coac-ve__chips", ".coac-ve__chip", "chip");
  const inputRef = useRef<HTMLInputElement>(null);
  // Quien ya estaba escribiendo en el buscador del HTML estático sigue ahí
  useEffect(() => {
    if (restoreSearchFocus) inputRef.current?.focus({ preventScroll: true });
  }, [restoreSearchFocus]);

  const clearTerm = () => {
    p.setTerm("");
    inputRef.current?.focus();
  };

  // Región viva única, siempre montada: el recuento de la búsqueda, el día elegido
  // y el aviso de que empieza el directo se dicen por aquí, una vez cada uno
  const [announcement, setAnnouncement] = useState("");
  const clearTimer = useRef<ReturnType<typeof setTimeout>>();
  const announce = useCallback((text: string, clearAfter = 0) => {
    clearTimeout(clearTimer.current);
    setAnnouncement(text);
    if (clearAfter) clearTimer.current = setTimeout(() => setAnnouncement(""), clearAfter);
  }, []);

  // Al escribir se espera a que pare (500 ms): un anuncio por palabra, no por tecla
  const previousMode = useRef(p.mode);
  useEffect(() => {
    const was = previousMode.current;
    previousMode.current = p.mode;
    // Al volver a «todo el programa» se vacía; mientras tanto no se toca (el aviso
    // de que empieza el directo también pasa por aquí)
    if (p.mode === "focus") return was === "focus" ? undefined : announce("");
    const text =
      p.mode === "search"
        ? `${p.count} ${p.count === 1 ? "agrupación encontrada" : "agrupaciones encontradas"}${
            p.scopeDate ? ` en ${formatSessionTitleDate(p.scopeDate)}` : ""
          }`
        : `Sesión elegida: ${p.scopeDate ? formatSessionTitleDate(p.scopeDate) : ""}`;
    const timer = setTimeout(() => announce(text), p.mode === "search" ? 500 : 0);
    return () => clearTimeout(timer);
  }, [announce, p.mode, p.count, p.scopeDate]);

  // Paso a directo: se pinta con un pequeño movimiento y se avisa una vez por
  // sesión. Nunca en el primer pintado ni si ya estaba en directo al cargar.
  const previousState = useRef(state);
  const announcedLive = useRef<string | null>(null);
  useEffect(() => {
    const was = previousState.current;
    previousState.current = state;
    if (state !== "live" || (was !== "countdown" && was !== "starting")) return;
    const card = rootRef.current?.querySelector<HTMLElement>(".coac-ve__status");
    animateOnce(
      card?.querySelector<HTMLElement>(".coac-ve__on-air") ?? null,
      { scale: [0.85, 1] },
      { duration: 320, easing: "var(--coac-ease-spring)" },
    );
    animateOnce(
      card?.querySelector<HTMLElement>(".coac-ve__status-title") ?? null,
      { clipPath: ["inset(100% 0 0 0)", "inset(0)"], translate: ["0 8px", "0 0"] },
      { duration: 320, delay: 60, easing: "var(--coac-ease-out)", fill: "backwards" },
    );
    for (const action of rootRef.current?.querySelectorAll<HTMLElement>(".coac-ve__action[data-live]") ??
      []) {
      animateOnce(action, { scale: [0.9, 1] }, { duration: 320, easing: "var(--coac-ease-spring)" });
    }
    const date = p.schedule.present?.date ?? null;
    if (p.live && date && announcedLive.current !== date) {
      announcedLive.current = date;
      announce(`Empieza la sesión. Actúa ${p.live.group.autor}.`, 5000);
    }
  }, [announce, p.live, p.schedule.present, rootRef, state]);

  // Relevo del directo: la agrupación que sale a escena entra con un pequeño
  // muelle y su segmento de la barra crece. Solo cuando cambia la agrupación en
  // directo (no al cargar, ni al volver a la pestaña tras saltarse varias).
  const liveId = p.live?.group.id ?? null;
  const previousLiveId = useRef(liveId);
  useEffect(() => {
    const was = previousLiveId.current;
    previousLiveId.current = liveId;
    if (!liveId || !was || was === liveId) return;
    const root = rootRef.current;
    animateOnce(
      root?.querySelector<HTMLElement>(".coac-ve__card[data-stage='live']") ?? null,
      { scale: [0.97, 1] },
      { duration: 320, easing: "var(--coac-ease-spring)" },
    );
    animateOnce(
      root?.querySelector<HTMLElement>(".coac-ve__segment[data-stage='live']") ?? null,
      { scale: ["1 0.57", "1 1"] },
      { duration: 320, easing: "var(--coac-ease-spring)" },
    );
  }, [liveId, rootRef]);

  // Un cambio del programa. Con animación va síncrono dentro de la View Transition
  // (`motion.ts` manda). Sin ella, como transición de React: la pulsación responde al
  // momento y las 120 tarjetas se repintan después; el scroll que lo acompaña espera a
  // que la transición termine, no a un número fijo de fotogramas.
  const [changing, startChange] = useTransition();
  const afterChange = useRef<(() => void) | null>(null);
  useEffect(() => {
    const run = afterChange.current;
    if (changing || !run) return;
    afterChange.current = null;
    requestAnimationFrame(() => requestAnimationFrame(run));
  }, [changing]);
  const changeProgramme = (options: Parameters<typeof withViewTransition>[0]) => {
    if (willAnimateChange()) return withViewTransition(options);
    const { change, after } = options;
    afterChange.current = after ? () => after(false) : null;
    startChange(change);
  };

  // Vuelve al programa de hoy (sin búsqueda ni día elegido) y baja hasta él. Si
  // el programa ya es ese, solo baja: no hay nada que cambiar de sitio.
  const goToToday = () => {
    if (p.mode === "focus") return scrollToProgramme();
    changeProgramme({ change: p.reset, after: scrollToProgramme, types: ["ve-reset"] });
  };

  // Elegir una modalidad: las filas que se ven se recolocan en vez de saltar; al
  // escribir en el buscador, en cambio, nada se anima
  const chooseModalidad = (modalidad: typeof p.modalidad) =>
    changeProgramme({
      change: () => p.setModalidad(modalidad),
      prepare: markVisibleSlots,
      after: (viaTransition) => viaTransition && markVisibleSlots(),
      types: ["ve-filter"],
    });

  // Elegir un día (o volver a pulsarlo para quitarlo): el telón corre hacia
  // el lado de la fecha, y su sesión queda justo bajo el filtro
  const chooseDay = (date: string, chosen: boolean) => {
    const current = p.sections[0]?.session.date ?? date;
    const type = chosen
      ? "ve-reset"
      : sessionDateKey(date) >= sessionDateKey(current)
        ? "ve-forward"
        : "ve-back";
    changeProgramme({
      // El día se elige sin tocar la búsqueda ni la modalidad: se quedan en ese día
      change: () => {
        p.setSelectedDate(chosen ? null : date);
        p.setSearchAll(false);
      },
      after: showChosenDay,
      types: [type],
    });
  };

  // Abre la búsqueda a todas las sesiones, o la vuelve a limitar al día elegido
  const toggleScope = () =>
    changeProgramme({
      change: () => p.setSearchAll(!p.searchAll),
      prepare: markVisibleSlots,
      after: (viaTransition) => viaTransition && markVisibleSlots(),
      types: ["ve-filter"],
    });

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
    <div
      ref={rootRef}
      className="coac-ve"
      data-view={p.mode}
      data-intro={intro || undefined}
      data-prerender={prerender ? "" : undefined}
    >
      {/* En escritorio, columna izquierda fija; en móvil no pinta caja (display: contents)
          y la cabecera queda fija arriba de toda la página. */}
      <div className="coac-ve__rail coac-scrollbar">
        <header id="siteHeader" className="coac-ve__top">
          <div className="coac-ve__top-row">
            {/* Título y, debajo, la fase: una sola fila con los accesos, para una cabecera baja */}
            <a className="coac-ve__home" href={HOME_URL} onClick={shell.goHome}>
              <FallaLogo className="coac-ve__logo" />
              <h1 className="coac-ve__brand-text">
                <span className="coac-ve__title">¿Quién canta hoy?</span>
                <span className="coac-ve__phase">
                  COAC {SEASON.year} · <span className="coac-ve__phase-short">{HOME_PHASE_SHORT}</span>{" "}
                  <span className="coac-ve__phase-full">{SEASON.phaseTitle}</span>
                </span>
              </h1>
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
                <p className="coac-ve__on-air" data-nosnippet>
                  <BroadcastIcon inline /> En directo
                </p>
                <p className="coac-ve__status-title" data-nosnippet>
                  {p.live.group.autor}
                </p>
                <p className="coac-ve__status-sub" data-nosnippet>
                  {p.live.group.nombre} · {p.live.estimatedTime}–
                  {addMinutes(p.live.estimatedTime, SEASON.minutesPerGroup)} aprox.
                </p>
              </>
            ) : upcoming ? (
              <>
                <p className="coac-ve__eyebrow" data-nosnippet>
                  Próxima sesión
                </p>
                {state === "countdown" ? (
                  <>
                    <p className="coac-ve__status-title" data-nosnippet>
                      {formatSessionTitleDate(upcoming.date)}
                    </p>
                    <Countdown target={upcoming.startsAt} />
                  </>
                ) : (
                  <>
                    <p className="coac-ve__status-title" data-nosnippet>
                      Empieza la sesión
                    </p>
                    <p className="coac-ve__status-sub" data-nosnippet>
                      {formatSessionTitleDate(upcoming.date)}
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
                <p className="coac-ve__eyebrow" data-nosnippet>
                  COAC {SEASON.year}
                </p>
                <p className="coac-ve__status-title" data-nosnippet>
                  La fase ha terminado
                </p>
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
        <main id="siteMain" className="coac-ve__main" tabIndex={-1}>
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
                  <ModalidadFilter value={p.modalidad} onChange={chooseModalidad} className="coac-ve__chip" />
                </div>
              </div>

              {/* Los días, parte del filtro: al elegir uno, su sesión sale justo debajo */}
              <nav className="coac-ve__calendar" aria-label="Sesiones de la fase">
                <DayStrip focusKey={`${p.schedule.activeSessionDate}|${p.selectedDate}`}>
                  {days.map((session) => {
                    const [weekday, day] = formatShortDate(session.date).split(" ");
                    const label = p.dayLabel(session);
                    const chosen = p.scopeDate === session.date;
                    return (
                      <li key={session.date}>
                        <button
                          type="button"
                          className="coac-ve__day"
                          data-status={session.status}
                          data-label={label || undefined}
                          data-upcoming={session.date === p.schedule.upcomingSession?.date || undefined}
                          aria-pressed={chosen}
                          onClick={() => chooseDay(session.date, chosen)}
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
              <p className="coac-ve__context">
                <span>
                  {p.mode === "search"
                    ? `${p.count} ${p.count === 1 ? "agrupación encontrada" : "agrupaciones encontradas"}`
                    : "Sesión elegida"}
                  {p.mode === "search" && (
                    <span className="coac-ve__scope">
                      {p.scopeDate
                        ? `Solo en ${formatSessionTitleDate(p.scopeDate)}`
                        : p.selectedDate
                          ? "En todas las sesiones"
                          : ""}
                    </span>
                  )}
                </span>
                <span className="coac-ve__context-actions">
                  {p.mode === "search" && p.selectedDate && (
                    <button type="button" className="coac-ve__scope-toggle" onClick={toggleScope}>
                      {p.scopeDate
                        ? "Buscar en todas las sesiones"
                        : `Buscar solo en ${formatSessionTitleDate(p.selectedDate)}`}
                    </button>
                  )}
                  <button type="button" className="coac-ve__reset" onClick={goToToday}>
                    Ver todo el programa
                  </button>
                </span>
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
                <span className="coac-ve__legend-note">
                  Recomendaciones personales de quien hace esta web.
                  <br />
                  No son del jurado ni de la organización.
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
                    id={session.date}
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
                        <time dateTime={sessionIsoDate(session.date)}>
                          {formatSessionTitleDate(session.date)}
                        </time>
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
                                  <span
                                    key={index}
                                    className="coac-ve__segment"
                                    data-stage={stage}
                                    style={{ "--i": Math.min(index, 6) } as CSSProperties}
                                  />
                                ))}
                              </span>
                              <span className="coac-ve__session-progress-text">
                                {prerender ? "\u00a0" : progressText(stages)}
                              </span>
                            </p>
                          );
                        })()}
                    </header>
                    <ol className="coac-ve__slots">
                      {performances.map((performance) => {
                        const stage = p.stageOf(session, performance);
                        return (
                          <Slot
                            key={performance.group.id}
                            group={performance.group}
                            estimatedTime={performance.estimatedTime}
                            stage={stage}
                            present={session.status === "present"}
                            liveProgress={stage === "live" ? p.liveProgress : 0}
                          />
                        );
                      })}
                    </ol>
                  </section>
                );
              })}
            </div>

            {p.sections.length === 0 && (
              <p className="coac-ve__empty">
                {p.scopeDate
                  ? `No hay nada con ese nombre en ${formatSessionTitleDate(p.scopeDate)}. Prueba con otro o busca en todas las sesiones.`
                  : "No hay nada con ese nombre. Prueba con otro."}
              </p>
            )}
          </div>

          <p className="coac-ve__estimate-note">
            Horas estimadas: {SEASON.minutesPerGroup} min por agrupación, con actuación y montaje.
          </p>

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
                      // Un <a> sin href es un enlace que aún no lleva a ningún sitio
                      // (lint:luz no admite un role="link" en un <span>)
                      // eslint-disable-next-line jsx-a11y/anchor-is-valid
                      <a
                        className="coac-ve__phase-item"
                        data-status={status}
                        role="link"
                        aria-disabled="true"
                      >
                        {content}
                      </a>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* La promesa va primero: es lo que más importa del pie */}
          <p className="coac-ve__footer-promise">
            <strong className="coac-ve__footer-promise-lead">Gratis y sin publicidad.</strong>{" "}
            <strong className="coac-ve__footer-promise-body">
              No gana dinero con nada, porque está hecha por y para los aficionados, y es 100&nbsp;%{" "}
              <a className="coac-ve__footer-link" href="https://github.com/nandovejer/coac">
                open source
              </a>
              .
            </strong>
          </p>
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
          <p className="coac-ve__footer-disclaimer">
            <strong>Web no oficial</strong>, hecha por un aficionado. No tiene relación con el Ayuntamiento de
            Cádiz ni con la organización del COAC. El listado y el orden de actuación proceden de la
            información pública del Ayuntamiento; las horas son estimadas y las recomendaciones, personales.{" "}
            <a className="coac-ve__footer-link" href="/THIRD-PARTY-LICENSES.txt">
              Licencias de terceros
            </a>
            .
          </p>
          {/* Créditos: lo último del pie, sin pasar por debajo del botón del modo de color */}
          <p className="coac-ve__footer-credits">
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
        </footer>
      </div>

      {/* Región viva única (lector de pantalla): siempre montada y sin botones dentro */}
      <p className="coac-sr-only coac-ve__announcer" role="status">
        {announcement}
      </p>

      <AppDialogs shell={shell} />
    </div>
  );
}
