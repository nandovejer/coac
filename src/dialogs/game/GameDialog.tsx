import { InfoDialog } from "../info/InfoDialog";
import "./GameDialog.css";

export const GAME_URL = "https://nandovejer.github.io/streetcai/";

/**
 * El juego (Streetcai) dentro de un marco. Solo se carga al pulsar el botón
 * rojo de la columna de escritorio: hasta entonces la web no le pide nada a
 * otra página. Al cargar, el marco recibe el foco para jugar con el teclado.
 */
export default function GameDialog({ onClose }: { onClose: () => void }) {
  return (
    <InfoDialog title="Te dijimos que no le dieras" titleId="game-title" onClose={onClose} size="wide">
      <iframe
        className="coac-game__frame"
        src={GAME_URL}
        title="Juego Streetcai"
        allow="fullscreen; gamepad; autoplay"
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-pointer-lock"
        onLoad={(event) => event.currentTarget.focus()}
      />
    </InfoDialog>
  );
}
