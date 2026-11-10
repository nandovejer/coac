import type { Schedule } from "../../domain/schedule";
import type { SessionsData } from "../../types";
import { AuthorSearch } from "./AuthorSearch";
import "./SearchSection.css";

interface SearchSectionProps {
  sessions: SessionsData;
  schedule: Schedule;
}

/** Bloque del buscador, justo debajo del hero: título, descripción y el campo. */
export function SearchSection({ sessions, schedule }: SearchSectionProps) {
  return (
    <section className="coac-search-section" aria-labelledby="searchSectionTitle">
      <div className="coac-search-section__inner">
        <h2 id="searchSectionTitle" className="coac-search-section__title">
          ¿Quieres saber qué coros saltarte? :D
        </h2>
        <p className="coac-search-section__description">
          No pierdas el tiempo: busca al autor, la autora o la agrupación y mira cuándo canta.
        </p>
        <AuthorSearch sessions={sessions} schedule={schedule} />
      </div>
    </section>
  );
}
