import { memo, type ReactNode } from "react";
import "./ThemeModeSwitch.css";

// El elemento <luz-theme-mode> lo define @luz-ds/core/theme-mode (ver main.tsx).
// Sin JavaScript es un grupo de radios nativo que cambia el modo con :has();
// con JavaScript añade un botón redondo (en línea: va en el panel) y esconde los radios. Luz no
// escribe ningún texto: los de aquí son los que lee un lector de pantalla.

interface ModeOption {
  value: "auto" | "light" | "dark" | "high-contrast";
  label: string;
  icon: ReactNode;
}

const modes: ModeOption[] = [
  {
    value: "auto",
    label: "Auto",
    icon: (
      <>
        <path d="M12 7.5a4.5 4.5 0 0 0 0 9ZM12 7.5a4.5 4.5 0 0 1 0 9M12 2.5v2M12 19.5v2M2.5 12h2M5.3 5.3l1.4 1.4M5.3 18.7l1.4-1.4" />
        <path d="M12 7.5a4.5 4.5 0 0 0 0 9Z" fill="currentColor" />
      </>
    ),
  },
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
  return (
    <luz-theme-mode inline="true">
      <fieldset className="luz-theme-mode__group">
        <legend className="luz-theme-mode__legend">Modo de color</legend>
        {modes.map(({ value, label, icon }) => (
          <label key={value} className="luz-theme-mode__option">
            <input
              className="luz-theme-mode__input"
              type="radio"
              name="luz-theme-mode"
              value={value}
              defaultChecked={value === "auto"}
            />
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
