import "./icons.css";

interface IconProps {
  path: string;
  /** Del tamaño del texto que lo rodea, en vez de 1,5 rem. */
  inline?: boolean;
}

function Icon({ path, inline = false }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={inline ? "coac-icon coac-icon--inline" : "coac-icon"}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export const CalendarIcon = () => (
  <Icon path="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
);

export const SearchIcon = () => (
  <Icon path="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
);

export const MonitorIcon = () => (
  <Icon path="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
);

export const BellIcon = () => (
  <Icon path="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3m13.416 0a8.969 8.969 0 0 1 2.168 4.5" />
);

/** Señal de emisión, para "en directo". */
export const BroadcastIcon = ({ inline }: { inline?: boolean }) => (
  <Icon
    inline={inline}
    path="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
  />
);

/**
 * Emisión en vivo, ((•)): punto macizo con dos ondas a cada lado. El punto
 * lleva su clase (`coac-icon__live-dot`) para pintarlo de rojo cuando hay
 * alguien actuando.
 */
export const LiveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.75}
    stroke="currentColor"
    className="coac-icon"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.288 15.712a5.25 5.25 0 0 1 0-7.424m7.424 0a5.25 5.25 0 0 1 0 7.424M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788"
    />
    <circle className="coac-icon__live-dot" cx="12" cy="12" r="2.25" fill="currentColor" stroke="none" />
  </svg>
);

/** Triángulo de reproducir, para los enlaces a vídeo. */
export const PlayIcon = ({ inline }: { inline?: boolean }) => (
  <Icon
    inline={inline}
    path="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
  />
);

export const CloseIcon = () => <Icon path="M6 18 18 6M6 6l12 12" />;

export const ChevronLeftIcon = () => <Icon path="M15.75 19.5 8.25 12l7.5-7.5" />;

export const ChevronRightIcon = () => <Icon path="m8.25 4.5 7.5 7.5-7.5 7.5" />;
