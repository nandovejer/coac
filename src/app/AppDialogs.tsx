import { lazy, Suspense } from "react";
import { PrivacyNotice } from "../dialogs/privacy/PrivacyNotice";
import type { Shell } from "./useShell";

// Los modales (y su CSS) solo se descargan al pedirlos (`useShell` los precarga).
const PrintSchedule = lazy(() => import("../dialogs/print/PrintSchedule"));
const AboutDialog = lazy(() => import("../dialogs/about/AboutDialog"));
const PrivacyDialog = lazy(() => import("../dialogs/privacy/PrivacyDialog"));
const GameDialog = lazy(() => import("../dialogs/game/GameDialog"));

/**
 * Modales abiertos (imprimir, «Quiénes somos», privacidad) y aviso de
 * privacidad de la app. Heredan los tokens `--coac-app-*` (`bg`, `card`,
 * `text`, `muted`, `line`, `primary`, `on-primary`, `soft`) del elemento raíz
 * de la app: se pinta una vez, dentro de él.
 */
export function AppDialogs({ shell }: { shell: Shell }) {
  const { print, about, privacy, game } = shell.dialogs;
  return (
    <>
      {print.open && (
        <Suspense fallback={null}>
          <PrintSchedule
            sessions={print.sessions}
            soonDates={print.soonDates}
            dayLabel={print.dayLabel}
            onClose={print.onClose}
          />
        </Suspense>
      )}
      {about.open && (
        <Suspense fallback={null}>
          <AboutDialog onClose={about.onClose} />
        </Suspense>
      )}
      {privacy.open && (
        <Suspense fallback={null}>
          <PrivacyDialog onClose={privacy.onClose} />
        </Suspense>
      )}
      {game.open && (
        <Suspense fallback={null}>
          <GameDialog onClose={game.onClose} />
        </Suspense>
      )}
      <PrivacyNotice onOpenPrivacy={privacy.onOpen} />
    </>
  );
}
