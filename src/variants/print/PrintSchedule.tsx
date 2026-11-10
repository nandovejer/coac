import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { SEASON } from "../../config/season";
import type { SessionView } from "../../domain/schedule";
import { CloseIcon } from "../../components/ui/icons";
import { formatShortDate, sessionDateKey } from "../../lib/dates";
import { MODALIDADES, type Modalidad, type RankingKey as Ranking } from "../../types";
import { capitalize } from "./format";
import { buildPorra } from "./porra";
import { PorraSheet } from "./PorraSheet";
import { PrintSheet, type PrintBlock } from "./PrintSheet";
import "./PrintSchedule.css";

interface PrintScheduleProps {
  /** Todas las sesiones de la fase (hoy, próximas y celebradas). */
  sessions: SessionView[];
  /** Las de «Hoy y mañana» (o las dos próximas), para el botón rápido. */
  soonDates: string[];
  /** «Hoy», «Mañana», «Celebrada» o vacío. */
  dayLabel: (session: SessionView) => string;
  onClose: () => void;
}

const RANKINGS: { value: Ranking; label: string }[] = [
  { value: "top", label: "Imprescindibles" },
  { value: "ok", label: "Recomendadas" },
  { value: "standar", label: "El resto" },
];

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Alterna un valor en un conjunto (para las casillas de los filtros). */
function toggle<T>(set: Set<T>, value: T) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Descarga un archivo creado en el navegador. */
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Casilla de un filtro, con su texto al lado. */
function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label className="coac-print-check">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{children}</span>
    </label>
  );
}

/**
 * Modal «Imprime tu horario»: filtros a un lado y la hoja en vista previa al
 * otro. Abre con todo marcado. Debajo de los filtros, el «Modo porra» cambia
 * la hoja por una con todas las agrupaciones para apostar quién pasa (o, en la
 * final, los premios). Se carga solo al pulsar el botón (lazy), así que no pesa
 * en la portada. Al imprimir, la hoja se pinta fuera de la app (portal en
 * <body>) y el CSS de impresión oculta todo lo demás.
 */
export default function PrintSchedule({ sessions, soonDates, dayLabel, onClose }: PrintScheduleProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dates, setDates] = useState(() => new Set(sessions.map((session) => session.date)));
  const [modalidades, setModalidades] = useState(() => new Set<Modalidad>(MODALIDADES));
  const [rankings, setRankings] = useState(() => new Set<Ranking>(["top", "ok", "standar"]));
  const [term, setTerm] = useState("");
  const [porraMode, setPorraMode] = useState(false);
  /** Qué se está generando ahora (para desactivar los botones y avisar). */
  const [busy, setBusy] = useState<"pdf" | "image" | null>(null);

  // Abre el modal al montarse; al cerrarlo (Esc, botón o fondo) avisa al padre.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    document.documentElement.classList.add("coac-print-mode");
    const close = () => onClose();
    const backdrop = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };
    dialog.addEventListener("close", close);
    dialog.addEventListener("click", backdrop);
    return () => {
      dialog.removeEventListener("close", close);
      dialog.removeEventListener("click", backdrop);
      document.documentElement.classList.remove("coac-print-mode");
    };
  }, [onClose]);

  const upcoming = sessions.filter((session) => session.status !== "past");
  const past = sessions.filter((session) => session.status === "past");
  const pastMarked = past.filter((session) => dates.has(session.date)).length;

  const blocks = useMemo((): PrintBlock[] => {
    const needle = normalize(term.trim());
    return sessions
      .filter((session) => dates.has(session.date))
      .sort((a, b) => sessionDateKey(a.date) - sessionDateKey(b.date))
      .map((session) => ({
        session,
        rows: session.performances.filter(
          ({ group }) =>
            modalidades.has(group.modalidad) &&
            rankings.has(group.ranking) &&
            (!needle || normalize(group.autor).includes(needle) || normalize(group.nombre).includes(needle)),
        ),
      }))
      .filter((block) => block.rows.length > 0);
  }, [dates, modalidades, rankings, sessions, term]);

  // La porra lleva todas las agrupaciones de la fase (solo filtra por modalidad)
  const porra = useMemo(() => buildPorra(sessions, modalidades), [sessions, modalidades]);

  const count = porraMode ? porra.count : blocks.reduce((total, block) => total + block.rows.length, 0);
  const summary = porraMode
    ? `Porra: ${plural(count, "agrupación", "agrupaciones")} en ${plural(porra.sections.length, "modalidad", "modalidades")}`
    : `${plural(count, "agrupación", "agrupaciones")} en ${plural(blocks.length, "sesión", "sesiones")}`;

  // PDF e imagen se generan aquí, en el navegador; su código solo se descarga al pulsar.
  const savePdf = async () => {
    setBusy("pdf");
    try {
      if (porraMode) (await import("./porraPdf")).downloadPorraPdf(porra);
      else (await import("./printPdf")).downloadSchedulePdf(blocks);
    } finally {
      setBusy(null);
    }
  };

  const saveImage = async () => {
    setBusy("image");
    try {
      if (porraMode) {
        const { renderPorraImage } = await import("./porraImage");
        download(await renderPorraImage(porra), `porra-coac-${SEASON.year}.png`);
      } else {
        const { renderScheduleImage } = await import("./printImage");
        download(await renderScheduleImage(blocks), `horario-coac-${SEASON.year}.png`);
      }
    } finally {
      setBusy(null);
    }
  };

  const sessionChecks = (list: SessionView[]) =>
    list.map((session) => (
      <Check
        key={session.date}
        checked={dates.has(session.date)}
        onChange={() => setDates((current) => toggle(current, session.date))}
      >
        <span className="coac-print-check__day">{formatShortDate(session.date)}</span>
        {dayLabel(session) && <span className="coac-print-check__hint">{dayLabel(session)}</span>}
      </Check>
    ));

  const sheet = porraMode ? <PorraSheet porra={porra} /> : <PrintSheet blocks={blocks} />;

  return (
    <>
      <dialog ref={dialogRef} className="coac-print-dialog" aria-labelledby="print-title">
        <div className="coac-print-dialog__panel">
          <header className="coac-print-dialog__head">
            <h2 id="print-title" className="coac-print-dialog__title">
              {porraMode ? "Imprime tu porra" : "Imprime tu horario"}
            </h2>
            <button
              type="button"
              className="coac-print-dialog__close"
              onClick={() => dialogRef.current?.close()}
            >
              <CloseIcon />
              <span className="coac-sr-only">Cerrar</span>
            </button>
          </header>

          <div className="coac-print-dialog__body">
            <form className="coac-print-filters" onSubmit={(event) => event.preventDefault()}>
              {/* En modo porra van todas las sesiones: estos filtros no cuentan */}
              <fieldset className="coac-print-filters__group" disabled={porraMode}>
                <legend>Sesiones</legend>
                <div className="coac-print-filters__quick">
                  <button type="button" onClick={() => setDates(new Set(sessions.map((s) => s.date)))}>
                    Todas
                  </button>
                  <button type="button" onClick={() => setDates(new Set(upcoming.map((s) => s.date)))}>
                    Próximas
                  </button>
                  <button type="button" onClick={() => setDates(new Set(soonDates))}>
                    Hoy y mañana
                  </button>
                  <button type="button" onClick={() => setDates(new Set())}>
                    Ninguna
                  </button>
                </div>
                <div className="coac-print-filters__days">{sessionChecks(upcoming)}</div>
                {past.length > 0 && (
                  <details className="coac-print-filters__past">
                    <summary>
                      Ya celebradas ({past.length}){pastMarked > 0 && ` · ${pastMarked} marcadas`}
                    </summary>
                    <div className="coac-print-filters__days">{sessionChecks(past)}</div>
                  </details>
                )}
              </fieldset>

              <fieldset className="coac-print-filters__group">
                <legend>Modalidades</legend>
                <div className="coac-print-filters__row">
                  {MODALIDADES.map((modalidad) => (
                    <Check
                      key={modalidad}
                      checked={modalidades.has(modalidad)}
                      onChange={() => setModalidades((current) => toggle(current, modalidad))}
                    >
                      {capitalize(modalidad)}
                    </Check>
                  ))}
                </div>
              </fieldset>

              <fieldset className="coac-print-filters__group" disabled={porraMode}>
                <legend>Valoración</legend>
                <div className="coac-print-filters__row">
                  {RANKINGS.map(({ value, label }) => (
                    <Check
                      key={value}
                      checked={rankings.has(value)}
                      onChange={() => setRankings((current) => toggle(current, value))}
                    >
                      {label}
                    </Check>
                  ))}
                </div>
              </fieldset>

              <fieldset className="coac-print-filters__group" disabled={porraMode}>
                <label className="coac-print-filters__search">
                  <span>Autor, autora o agrupación</span>
                  <input
                    type="text"
                    enterKeyHint="done"
                    autoComplete="off"
                    placeholder="Opcional"
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                  />
                </label>
              </fieldset>

              <button
                type="button"
                role="switch"
                aria-checked={porraMode}
                aria-describedby="print-porra-hint"
                className="coac-print-porra"
                onClick={() => setPorraMode((on) => !on)}
              >
                <span className="coac-print-porra__text">
                  <span className="coac-print-porra__label">Modo porra</span>
                  <span id="print-porra-hint" className="coac-print-porra__hint">
                    {porra.kind === "prizes"
                      ? "Una hoja para adivinar los premios de la final, del 1.º al 4.º en cada modalidad."
                      : "Una hoja con todas las agrupaciones y una casilla para adivinar cuáles pasan."}
                  </span>
                </span>
                <span className="coac-print-porra__switch" aria-hidden="true" />
              </button>
            </form>

            <section className="coac-print-dialog__preview" aria-label="Vista previa">
              {count > 0 ? (
                sheet
              ) : (
                <p className="coac-print-dialog__empty">
                  {porraMode
                    ? "Marca alguna modalidad para ver la porra."
                    : "No hay ninguna agrupación con estos filtros. Marca alguna sesión o quita filtros."}
                </p>
              )}
            </section>
          </div>

          <footer className="coac-print-dialog__actions">
            <p className="coac-print-dialog__count" role="status">
              {summary}
            </p>
            <button
              type="button"
              className="coac-print-dialog__button"
              disabled={count === 0}
              onClick={() => window.print()}
            >
              Imprimir
            </button>
            <button
              type="button"
              className="coac-print-dialog__button"
              disabled={count === 0 || busy !== null}
              onClick={saveImage}
            >
              {busy === "image" ? "Creando imagen…" : "Descargar imagen"}
            </button>
            <button
              type="button"
              className="coac-print-dialog__button"
              data-primary
              disabled={count === 0 || busy !== null}
              onClick={savePdf}
            >
              {busy === "pdf" ? "Creando PDF…" : "Descargar PDF"}
            </button>
          </footer>
        </div>
      </dialog>

      {/* Lo único que sale en papel (ver PrintSchedule.css) */}
      {createPortal(<div className="coac-print-root">{sheet}</div>, document.body)}
    </>
  );
}
