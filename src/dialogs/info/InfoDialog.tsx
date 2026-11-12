import { useEffect, useRef, type ReactNode } from "react";
import { FallaLogo } from "../../components/ui/FallaLogo";
import { CloseIcon } from "../../components/ui/icons";
import { afterDialogExit } from "../../lib/motion";
import "../dialog-motion.css";
import "./InfoDialog.css";

/**
 * Modal de lectura con el logo, el título y «Cerrar» (Quiénes somos,
 * Privacidad). Es un `<dialog>` nativo: Escape y el fondo lo cierran, y al
 * cerrarse devuelve el foco a lo que lo abrió.
 */
export function InfoDialog({
  title,
  titleId,
  onClose,
  children,
}: {
  title: string;
  titleId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    const close = () => afterDialogExit(dialog, onClose);
    const backdrop = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };
    dialog.addEventListener("close", close);
    dialog.addEventListener("click", backdrop);
    return () => {
      dialog.removeEventListener("close", close);
      dialog.removeEventListener("click", backdrop);
    };
  }, [onClose]);

  return (
    <dialog ref={dialogRef} className="coac-info" aria-labelledby={titleId}>
      <div className="coac-info__panel">
        <header className="coac-info__head">
          <FallaLogo className="coac-info__logo" />
          <h2 id={titleId} className="coac-info__title">
            {title}
          </h2>
          <button type="button" className="coac-info__close" onClick={() => dialogRef.current?.close()}>
            <CloseIcon />
            <span className="coac-sr-only">Cerrar</span>
          </button>
        </header>

        <div className="coac-info__body">{children}</div>
      </div>
    </dialog>
  );
}

/** Bloque con su título dentro de un `InfoDialog`. */
export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="coac-info__section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
