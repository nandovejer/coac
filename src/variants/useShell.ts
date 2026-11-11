import { useCallback, useState, type MouseEvent } from "react";
import { usePrivacyRoute } from "./privacy/usePrivacyRoute";
import type { useProgramme } from "./useProgramme";

const loadPrint = () => import("./print/PrintSchedule");
const loadAbout = () => import("./about/AboutDialog");
const loadPrivacy = () => import("./privacy/PrivacyDialog");

export const HOME_URL = import.meta.env.BASE_URL;

/** Centra la tarjeta de la agrupación y le pasa el foco (para teclado y lector de pantalla). */
export function scrollToGroup(id: string) {
  const card = document.getElementById(id);
  if (!card) return;
  card.scrollIntoView({ block: "center" });
  card.focus({ preventScroll: true });
}

/** Tras un cambio de estado, espera a que React pinte antes de mover el scroll. */
export const afterPaint = (callback: () => void) =>
  requestAnimationFrame(() => requestAnimationFrame(callback));

/**
 * Lo que necesita el rediseño E y no depende del aspecto: volver a la
 * portada, ir a la agrupación en directo y abrir los modales de imprimir,
 * «Quiénes somos» y privacidad. Los modales los pinta `<ShellDialogs>`.
 */
export function useShell(p: ReturnType<typeof useProgramme>) {
  const [printOpen, setPrintOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { privacyOpen, openPrivacy, closePrivacy } = usePrivacyRoute();
  const closePrint = useCallback(() => setPrintOpen(false), []);
  const closeAbout = useCallback(() => setAboutOpen(false), []);

  // Botón «Hoy y mañana» del modal de imprimir (o las dos próximas). Al abrir van todas.
  const printSoon = (() => {
    const labelled = p.all.filter((s) => ["Hoy", "Mañana"].includes(p.dayLabel(s)));
    if (labelled.length > 0) return labelled.map((s) => s.date);
    const upcoming = p.all.filter((s) => s.status !== "past").slice(0, 2);
    return (upcoming.length > 0 ? upcoming : p.all.slice(-1)).map((s) => s.date);
  })();

  /** La portada es siempre la fase en curso: sin búsqueda ni día elegido, arriba del todo. */
  const goHome = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    p.reset();
    window.scrollTo({ top: 0 });
  };

  /** Lleva a la agrupación en directo; si el programa muestra otra cosa, vuelve antes a hoy. */
  const goToLive = (event: MouseEvent<HTMLElement>) => {
    if (!p.live) return;
    event.preventDefault();
    const id = p.live.group.id;
    if (document.getElementById(id)) return scrollToGroup(id);
    p.reset();
    afterPaint(() => scrollToGroup(id));
  };

  return {
    goHome,
    goToLive,
    /** Props del botón «Imprime tu horario» (precarga el modal al acercarse). */
    printButton: {
      "aria-haspopup": "dialog" as const,
      onPointerEnter: loadPrint,
      onFocus: loadPrint,
      onClick: () => setPrintOpen(true),
    },
    /** Props del botón «Quiénes somos». */
    aboutButton: {
      "aria-haspopup": "dialog" as const,
      onPointerEnter: loadAbout,
      onFocus: loadAbout,
      onClick: () => setAboutOpen(true),
    },
    /** Props del enlace «Privacidad» (su `href` es `PRIVACY_HASH`). */
    privacyLink: { onPointerEnter: loadPrivacy, onFocus: loadPrivacy, onClick: openPrivacy },
    /** Estado de los modales, para `<ShellDialogs>`. */
    dialogs: {
      print: {
        open: printOpen,
        sessions: p.all,
        soonDates: printSoon,
        dayLabel: p.dayLabel,
        onClose: closePrint,
      },
      about: { open: aboutOpen, onClose: closeAbout },
      privacy: { open: privacyOpen, onOpen: openPrivacy, onClose: closePrivacy },
    },
  };
}

export type Shell = ReturnType<typeof useShell>;
