import { youtubeSearchUrl } from "../lib/youtube";
import { MODALIDADES, type Modalidad, type PreviousGroup } from "../types";

/** Qué fue de la agrupación el año anterior: enlace a su vídeo o «nueva». */
export function PreviousNote({ previous, className }: { previous: PreviousGroup | null; className: string }) {
  if (!previous) return null;
  if ("isNew" in previous) return <span className={className}>Agrupación nueva</span>;
  return (
    <a className={className} href={youtubeSearchUrl(`COAC ${previous.name}`)}>
      En {previous.year}: {previous.name}
      <span className="coac-sr-only"> (vídeo en YouTube)</span>
    </a>
  );
}

interface ModalidadFilterProps {
  value: Modalidad | null;
  onChange: (value: Modalidad | null) => void;
  /** Clase de cada botón; el elegido lleva `aria-pressed="true"`. */
  className: string;
  /** Texto de cada opción (por defecto «Coro», «Comparsa»…). */
  format?: (modalidad: Modalidad) => string;
}

const capitalize = (modalidad: Modalidad) => modalidad.charAt(0) + modalidad.slice(1).toLowerCase();

/** Botones de alternar para filtrar por modalidad («Todas» + las cuatro). */
export function ModalidadFilter({ value, onChange, className, format = capitalize }: ModalidadFilterProps) {
  return (
    <>
      {[null, ...MODALIDADES].map((option) => (
        <button
          key={option ?? "todas"}
          type="button"
          className={className}
          data-modalidad={option ?? undefined}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {option ? format(option) : "Todas"}
        </button>
      ))}
    </>
  );
}
