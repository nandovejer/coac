import type { ReactNode } from "react";
import { brandGradientClass } from "../../styles";

interface GradientHeadingProps {
  as?: "h2" | "h3" | "summary";
  className?: string;
  children: ReactNode;
}

/** Título con el degradado de la marca; el tamaño y el margen los pone quien lo usa. */
export function GradientHeading({ as: Tag = "h2", className = "", children }: GradientHeadingProps) {
  return (
    <Tag
      className={`font-extrabold tracking-tighter bg-clip-text text-transparent ${brandGradientClass} ${className}`}
    >
      {children}
    </Tag>
  );
}
