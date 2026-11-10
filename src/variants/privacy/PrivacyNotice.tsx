import { useEffect, useRef, useState, type MouseEvent } from "react";
import { PRIVACY_HASH, PRIVACY_NOTICE_KEY, PRIVACY_VERSION } from "./policy";
import "./PrivacyNotice.css";

function alreadySeen() {
  try {
    return window.localStorage.getItem(PRIVACY_NOTICE_KEY) === PRIVACY_VERSION;
  } catch {
    return false;
  }
}

/**
 * Aviso de privacidad. La web no usa cookies ni recoge datos, así que no pide
 * permiso: solo lo cuenta una vez, en palabras sencillas, y enlaza a la página
 * de privacidad. Es una franja fina abajo del todo, que no bloquea la página;
 * «Lo entiendo» la cierra para siempre (hasta que cambie la política).
 */
export function PrivacyNotice({
  onOpenPrivacy,
}: {
  onOpenPrivacy: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  // Sale después del primer pintado: no retrasa ni compite con el contenido.
  useEffect(() => {
    if (!alreadySeen()) setVisible(true);
  }, []);

  // Mientras se ve, el pie reserva su alto para que el aviso no tape el final.
  useEffect(() => {
    const notice = ref.current;
    if (!visible || !notice) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      root.style.setProperty("--coac-privacy-notice-h", `${notice.offsetHeight}px`);
    });
    observer.observe(notice);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--coac-privacy-notice-h");
    };
  }, [visible]);

  const dismiss = () => {
    try {
      window.localStorage.setItem(PRIVACY_NOTICE_KEY, PRIVACY_VERSION);
    } catch {
      // Sin almacenamiento (modo privado estricto): se cierra solo esta vez.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside ref={ref} className="coac-privacy-notice" aria-label="Aviso de privacidad">
      <p className="coac-privacy-notice__text">
        <strong>Aquí no hay cookies.</strong> Esta web no sabe quién eres: solo recuerda si la prefieres clara
        u oscura.
      </p>
      <div className="coac-privacy-notice__actions">
        <a className="coac-privacy-notice__more" href={PRIVACY_HASH} onClick={onOpenPrivacy}>
          Más información
        </a>
        <button type="button" className="coac-privacy-notice__ok" onClick={dismiss}>
          Lo entiendo
        </button>
      </div>
    </aside>
  );
}
