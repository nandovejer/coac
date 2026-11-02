import { useMemo, useState } from "react";
import { filterByAuthor } from "../../domain/filterByAuthor";
import type { SessionsData } from "../../types";
import { GradientHeading } from "../ui/GradientHeading";

/** Buscador de autores: lista enlaces a la fila de cada agrupación que coincide. */
export function AuthorSearch({ sessions }: { sessions: SessionsData }) {
  const [searchTerm, setSearchTerm] = useState("");

  const matches = useMemo(
    () => (searchTerm ? filterByAuthor(sessions, searchTerm) : []),
    [sessions, searchTerm],
  );

  return (
    <aside className="bg-white p-6 rounded-lg shadow-lg w-full flex flex-col " id="searchAuthor">
      <GradientHeading className="text-2xl md:text-3xl mb-4 text-center">
        Busca el autor@ destacad@
      </GradientHeading>

      <label htmlFor="searchAuthorInput" className="sr-only">
        Buscar por autor@
      </label>
      <input
        id="searchAuthorInput"
        type="text"
        placeholder="Busca por autor@..."
        className="w-full border h-12 shadow mb-4 p-2 rounded max-w-4xl m-auto"
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {searchTerm && ( // Solo renderiza cuando hay un término de búsqueda
        <div className="max-w-6xl flex flex-wrap gap-2 m-auto" role="list">
          {matches.map(({ date, group }) => (
            <a
              key={group.id}
              href={`#${group.id}`}
              title={`Canta su ${group.modalidad} el ${date}`}
              className="bg-blue-200 hover:bg-blue-300 py-1 px-2 rounded-lg text-sm"
            >
              {group.autor}
            </a>
          ))}
        </div>
      )}
    </aside>
  );
}
