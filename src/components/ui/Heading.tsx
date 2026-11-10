import type { ReactNode } from "react";
import "./Heading.css";

interface HeadingProps {
  as?: "h2" | "h3";
  className?: string;
  children: ReactNode;
}

/** Título en tinta, sin adornos; el tamaño, el peso y el margen los pone quien lo usa. */
export function Heading({ as: Tag = "h2", className = "", children }: HeadingProps) {
  return <Tag className={`coac-heading ${className}`.trim()}>{children}</Tag>;
}
