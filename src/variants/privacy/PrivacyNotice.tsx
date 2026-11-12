import { useEffect, useRef, useState, type MouseEvent } from "react";
import { animateOnce } from "../motion";
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
  const [leaving, setLeaving] = useState(false);
  const ref = useRef<HTMLElement>(null);

  // Sale un rato después del primer pintado (600 ms): no compite con el contenido
  // ni con el movimiento de la entrada de la página.
  useEffect(() => {
    if (alreadySeen()) return;
    const timer = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(timer);
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
    // El aviso desaparece con el foco dentro: pasa al programa, no a <body>
    if (ref.current?.contains(document.activeElement)) {
      document.getElementById("siteMain")?.focus({ preventScroll: true });
    }
    // Se va como vino, hacia abajo (sin movimiento, desaparece en seco); mientras
    // sale, el botón queda desactivado
    setLeaving(true);
    const exit = animateOnce(
      ref.current,
      { transform: ["translateY(0)", "translateY(100%)"] },
      { duration: 180, easing: "var(--coac-ease-in)", fill: "forwards" },
    );
    void (exit?.finished ?? Promise.resolve()).then(() => setVisible(false));
  };

  if (!visible) return null;

  return (
    <aside ref={ref} className="coac-privacy-notice" aria-label="Aviso de privacidad">
      <p className="coac-privacy-notice__text">
        <strong>Aquí no hay cookies.</strong> Esta web no sabe quién eres: solo recuerda cómo prefieres verla.
      </p>
      <div className="coac-privacy-notice__actions">
        <a className="coac-privacy-notice__more" href={PRIVACY_HASH} onClick={onOpenPrivacy}>
          Más información
        </a>
        <button type="button" className="coac-privacy-notice__ok" onClick={dismiss} disabled={leaving}>
          Lo entiendo
        </button>
      </div>
    </aside>
  );
}
