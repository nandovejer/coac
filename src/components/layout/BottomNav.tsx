import type { ReactNode } from "react";
import { BellIcon, CalendarIcon, MonitorIcon, SearchIcon } from "../ui/icons";

interface BottomNavProps {
  liveUrl: string;
  activeSessionDate: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  title?: string;
  external?: boolean;
}

const linkClassName =
  "flex flex-col justify-center items-center font-medium px-2 py-2 md:px-5 md:py-2  text-center w-1/4 max-w-xs hover:bg-gradient-to-r from-blue-500  to-blue-400";

/** Navegación fija en la parte inferior de la pantalla. */
export function BottomNav({ liveUrl, activeSessionDate }: BottomNavProps) {
  const items: NavItem[] = [
    { href: "#session-past", label: "Pasadas", icon: <CalendarIcon />, title: "Sesiones pasadas" },
    { href: "#searchAuthor", label: "Buscar", icon: <SearchIcon />, title: "Buscar Autor en la web" },
    { href: liveUrl, label: "Ver Directo", icon: <MonitorIcon />, external: true },
    {
      href: `#${activeSessionDate}`,
      label: "Sesión hoy",
      icon: <BellIcon />,
      title: `Última Sesión ${activeSessionDate}`,
    },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="flex justify-center items-center shadow-lg w-full z-10  text-white bg-gray-800 fixed bottom-0"
    >
      {items.map(({ href, label, icon, title, external }) => (
        <a
          key={label}
          href={href}
          title={title}
          className={linkClassName}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {icon}
          <span className="text-xs md:text-sm">{label}</span>
        </a>
      ))}
    </nav>
  );
}
