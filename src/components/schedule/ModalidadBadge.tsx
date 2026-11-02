import { modalidadColors } from "../../styles";
import type { Modalidad } from "../../types";

export function ModalidadBadge({ modalidad }: { modalidad: Modalidad }) {
  return (
    <span className={`font-bold rounded px-1 py-0.5 inline-block w-fit ${modalidadColors[modalidad]}`}>
      {modalidad}
    </span>
  );
}
