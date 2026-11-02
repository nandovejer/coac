import type { ReactNode } from "react";
import { BellIcon, CalendarIcon, MonitorIcon, SearchIcon } from "../ui/icons";
import "./BottomNav.css";

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
    <nav aria-label="Navegación principal" className="coac-bottom-nav">
      {items.map(({ href, label, icon, title, external }) => (
        <a
          key={label}
          href={href}
          title={title}
          className="coac-bottom-nav__link"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {icon}
          <span className="coac-bottom-nav__label">{label}</span>
        </a>
      ))}
    </nav>
  );
}
