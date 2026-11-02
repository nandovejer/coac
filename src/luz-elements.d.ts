import type { DetailedHTMLProps, HTMLAttributes } from "react";

// Elementos personalizados de Luz que se usan en JSX.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "luz-theme-mode": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
