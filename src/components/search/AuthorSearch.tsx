import { useMemo, useState } from "react";
import { filterByAuthor } from "../../domain/filterByAuthor";
import type { SessionsData } from "../../types";
import { GradientHeading } from "../ui/GradientHeading";
import "./AuthorSearch.css";

/** Buscador de autores: lista enlaces a la fila de cada agrupación que coincide. */
export function AuthorSearch({ sessions }: { sessions: SessionsData }) {
  const [searchTerm, setSearchTerm] = useState("");

  const matches = useMemo(
    () => (searchTerm ? filterByAuthor(sessions, searchTerm) : []),
    [sessions, searchTerm],
  );

  return (
    <aside className="coac-search" id="searchAuthor">
      <GradientHeading className="coac-search__title">Busca el autor@ destacad@</GradientHeading>

      <label htmlFor="searchAuthorInput" className="coac-sr-only">
        Buscar por autor@
      </label>
      <input
        id="searchAuthorInput"
        type="text"
        placeholder="Busca por autor@..."
        className="coac-search__input"
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {searchTerm && ( // Solo renderiza cuando hay un término de búsqueda
        <div className="coac-search__results" role="list">
          {matches.map(({ date, group }) => (
            <a
              key={group.id}
              href={`#${group.id}`}
              title={`Canta su ${group.modalidad} el ${date}`}
              className="coac-search__chip"
            >
              {group.autor}
            </a>
          ))}
        </div>
      )}
    </aside>
  );
}
