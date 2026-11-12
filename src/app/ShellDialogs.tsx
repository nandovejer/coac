import { lazy, Suspense } from "react";
import { PrivacyNotice } from "./privacy/PrivacyNotice";
import type { Shell } from "./useShell";

// Los modales (y su CSS) solo se descargan al pedirlos (`useShell` los precarga).
const PrintSchedule = lazy(() => import("./print/PrintSchedule"));
const AboutDialog = lazy(() => import("./about/AboutDialog"));
const PrivacyDialog = lazy(() => import("./privacy/PrivacyDialog"));

/**
 * Modales abiertos (imprimir, «Quiénes somos», privacidad) y aviso de
 * privacidad de la app. Heredan los tokens `--app-*` (`bg`, `card`,
 * `text`, `muted`, `line`, `primary`, `on-primary`, `soft`) del elemento raíz
 * de la app: se pinta una vez, dentro de él.
 */
export function ShellDialogs({ shell }: { shell: Shell }) {
  const { print, about, privacy } = shell.dialogs;
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
      <PrivacyNotice onOpenPrivacy={privacy.onOpen} />
    </>
  );
}
