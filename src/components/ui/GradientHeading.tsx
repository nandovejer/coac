import type { ReactNode } from "react";
import "./GradientHeading.css";

interface GradientHeadingProps {
  as?: "h2" | "h3" | "summary";
  className?: string;
  children: ReactNode;
}

/** Título con el degradado de la marca; el tamaño y el margen los pone quien lo usa. */
export function GradientHeading({ as: Tag = "h2", className = "", children }: GradientHeadingProps) {
  return <Tag className={`coac-gradient-heading ${className}`.trim()}>{children}</Tag>;
}
