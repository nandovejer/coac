import { youtubeSearchUrl } from "../../lib/youtube";
import type { PreviousGroup } from "../../types";

/** Qué fue de la agrupación el año anterior: enlace a su vídeo o «nueva». */
export function PreviousNote({ previous, className }: { previous: PreviousGroup | null; className: string }) {
  if (!previous) return null;
  if ("isNew" in previous) return <span className={className}>Agrupación nueva</span>;
  return (
    <a className={className} href={youtubeSearchUrl(`COAC ${previous.name}`)}>
      En {previous.year}: {previous.name}
      <span className="coac-sr-only"> (vídeo en YouTube)</span>
    </a>
  );
}
