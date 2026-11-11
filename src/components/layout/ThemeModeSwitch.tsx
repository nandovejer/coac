import { memo, useEffect, useRef, type ReactNode } from "react";
import "./ThemeModeSwitch.css";

// El elemento <luz-theme-mode> lo define @luz-ds/core/theme-mode (ver main.tsx).
// Sin JavaScript es un grupo de radios nativo que cambia el modo con :has();
// con JavaScript añade un botón redondo (en línea: va en el pie) y esconde los radios. Luz no
// escribe ningún texto: los de aquí son los que lee un lector de pantalla.
// Solo tres modos: claro, oscuro y alto contraste (sin «Auto»).

type Mode = "light" | "dark" | "high-contrast";

interface ModeOption {
  value: Mode;
  label: string;
  icon: ReactNode;
}

const MODES: Mode[] = ["light", "dark", "high-contrast"];
const STORAGE_KEY = "luz-theme"; // la clave en la que Luz guarda la elección

/**
 * Sin «Auto», el botón necesita una elección desde el principio: si aún no hay
 * ninguna guardada, se guarda el modo que ya pinta la página (el del sistema,
 * que el script de arranque de Luz pone en <html data-mode>). Va antes de que
 * <luz-theme-mode> lea la elección, así arranca con su icono y sin avisos.
 */
function adoptCurrentMode() {
  try {
    if (MODES.includes(localStorage.getItem(STORAGE_KEY) as Mode)) return;
    const current = document.documentElement.dataset.mode as Mode;
    const system: Mode = matchMedia("(prefers-contrast: more)").matches
      ? "high-contrast"
      : matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    localStorage.setItem(STORAGE_KEY, MODES.includes(current) ? current : system);
  } catch {
    // Sin almacenamiento: lo resuelve el efecto de ThemeModeSwitchView
  }
}

interface LuzThemeModeElement extends HTMLElement {
  choice?: string;
  mode?: string;
}

const modes: ModeOption[] = [
  {
    value: "light",
    label: "Claro",
    icon: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </>
    ),
  },
  { value: "dark", label: "Oscuro", icon: <path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10Z" /> },
  {
    value: "high-contrast",
    label: "Alto contraste",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" />
      </>
    ),
  },
];

function ThemeModeSwitchView() {
  const ref = useRef<LuzThemeModeElement>(null);
  if (typeof window !== "undefined") adoptCurrentMode();

  // Si no se pudo guardar (almacenamiento bloqueado), Luz arranca en «Auto»: se
  // elige el modo que está en uso para que el botón muestre uno de los tres.
  useEffect(() => {
    const element = ref.current;
    if (element?.choice === "auto" && element.mode) element.choice = element.mode;
  }, []);

  return (
    <luz-theme-mode ref={ref} inline="true">
      <fieldset className="luz-theme-mode__group">
        <legend className="luz-theme-mode__legend">Modo de color</legend>
        {modes.map(({ value, label, icon }) => (
          <label key={value} className="luz-theme-mode__option">
            <input className="luz-theme-mode__input" type="radio" name="luz-theme-mode" value={value} />
            <svg className="luz-theme-mode__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              {icon}
            </svg>
            {label}
          </label>
        ))}
      </fieldset>
    </luz-theme-mode>
  );
}

// Luz añade a este elemento un botón y un aviso para lectores de pantalla: sin
// props que cambien, React no debe volver a pintarlo.
export const ThemeModeSwitch = memo(ThemeModeSwitchView);
