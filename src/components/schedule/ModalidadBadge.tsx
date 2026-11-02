import type { Modalidad } from "../../types";
import "./ModalidadBadge.css";

export function ModalidadBadge({ modalidad }: { modalidad: Modalidad }) {
  return (
    <span className="coac-badge" data-modalidad={modalidad}>
      {modalidad}
    </span>
  );
}
