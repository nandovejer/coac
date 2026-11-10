import { PlayIcon } from "../ui/icons";
import { youtubeSearchUrl } from "../../lib/youtube";
import type { PreviousGroup } from "../../types";
import "./PreviousYearLink.css";

/** Qué fue de la agrupación el año anterior: enlace a su vídeo o "nueva agrupación". */
export function PreviousYearLink({ previous }: { previous: PreviousGroup | null }) {
  let content = null;

  if (previous && "isNew" in previous) {
    content = "Es una nueva agrupación";
  } else if (previous) {
    content = (
      <a className="coac-previous__link" href={youtubeSearchUrl(`COAC ${previous.name}`)}>
        <PlayIcon inline /> Anteriormente: {previous.name}
        <span className="coac-sr-only"> (vídeo en YouTube)</span>
      </a>
    );
  }

  return <small className="coac-previous">{content}</small>;
}
