import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { searchGroups } from "../../domain/filterByAuthor";
import type { PerformanceView, Schedule } from "../../domain/schedule";
import { openDetailsFor } from "../../hooks/useOpenDetailsOnAnchor";
import { MODALIDADES, type Modalidad, type SessionsData } from "../../types";
import { CloseIcon, SearchIcon } from "../ui/icons";
import { Heading } from "../ui/Heading";
import { SearchResultCard } from "./SearchResultCard";
import "./AuthorSearch.css";

interface AuthorSearchProps {
  sessions: SessionsData;
  schedule: Schedule;
}

/**
 * Buscador de autores y agrupaciones, con filtro por modalidad. En el panel es un campo que abre un modal; en el modal
 * se escribe y cada coincidencia sale como tarjeta con todos los datos de su
 * fila. Al pulsar una tarjeta se cierra el modal y se baja a esa fila.
 */
export function AuthorSearch({ sessions, schedule }: AuthorSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalidad, setModalidad] = useState<Modalidad | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cada agrupación con su hora estimada y estado, por id.
  const performances = useMemo(() => {
    const byId = new Map<string, PerformanceView>();
    const all = [...(schedule.present ? [schedule.present] : []), ...schedule.future, ...schedule.past];
    for (const session of all) {
      for (const performance of session.performances) byId.set(performance.group.id, performance);
    }
    return byId;
  }, [schedule]);

  const matches = useMemo(
    () => searchGroups(sessions, { term: searchTerm, modalidad }),
    [sessions, searchTerm, modalidad],
  );

  const openDialog = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    inputRef.current?.focus();
  }, []);

  // El menú inferior («Buscar») enlaza a #searchAuthor: también abre el modal.
  useEffect(() => {
    const onClick = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href="#searchAuthor"]');
      if (!link) return;
      event.preventDefault();
      openDialog();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openDialog]);

  // Clic en el fondo (::backdrop) cierra el modal; con teclado, Esc o el botón de cerrar.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClick = (event: Event) => event.target === dialog && dialog.close();
    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, []);

  const select = (id: string, event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    openDetailsFor(id);
    dialogRef.current?.close();
    history.pushState(null, "", `#${id}`);
    // Tras cerrar, el navegador devuelve el foco al campo del panel: el scroll
    // va después para que gane el de la fila.
    setTimeout(() => document.getElementById(id)?.scrollIntoView(), 0);
  };

  const hasTerm = searchTerm.trim() !== "";

  return (
    <aside className="coac-search" id="searchAuthor">
      <Heading className="coac-search__title">Busca autor@s y agrupaciones</Heading>

      <button type="button" className="coac-search__trigger" aria-haspopup="dialog" onClick={openDialog}>
        <SearchIcon />
        <span>Busca por autor@ o agrupación...</span>
      </button>

      <dialog ref={dialogRef} className="coac-search-dialog" aria-labelledby="searchDialogTitle">
        <div className="coac-search-dialog__panel">
          <div className="coac-search-dialog__head">
            <h2 id="searchDialogTitle" className="coac-search-dialog__title">
              Busca autor@s y agrupaciones
            </h2>
            <button
              type="button"
              className="coac-search-dialog__close"
              onClick={() => dialogRef.current?.close()}
            >
              <CloseIcon />
              <span className="coac-sr-only">Cerrar el buscador</span>
            </button>
          </div>

          <label htmlFor="searchAuthorInput" className="coac-sr-only">
            Buscar por autor@ o agrupación
          </label>
          <input
            ref={inputRef}
            id="searchAuthorInput"
            type="text"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Busca por autor@ o agrupación..."
            className="coac-search__input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="coac-search-dialog__filters" role="group" aria-label="Filtrar por modalidad">
            {[null, ...MODALIDADES].map((option) => (
              <button
                key={option ?? "todas"}
                type="button"
                className="coac-search-dialog__filter"
                aria-pressed={modalidad === option}
                onClick={() => setModalidad(option)}
              >
                {option ? option.charAt(0) + option.slice(1).toLowerCase() : "Todas"}
              </button>
            ))}
          </div>

          <p className="coac-search-dialog__status" role="status">
            {!hasTerm && !modalidad && "Escribe un autor@ o una agrupación, o elige una modalidad."}
            {(hasTerm || modalidad) && matches.length === 0 && "No hay ninguna agrupación que coincida."}
            {matches.length > 0 && `${matches.length} ${matches.length === 1 ? "resultado" : "resultados"}`}
          </p>

          <ul className="coac-search-dialog__results coac-scrollbar">
            {matches.map(({ date, group }) => {
              const performance = performances.get(group.id);
              return (
                performance && (
                  <li key={group.id}>
                    <SearchResultCard date={date} performance={performance} onSelect={select} />
                  </li>
                )
              );
            })}
          </ul>
        </div>
      </dialog>
    </aside>
  );
}
