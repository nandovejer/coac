import { MODALIDADES, type Modalidad } from "../../types";

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
