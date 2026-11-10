import { useMemo } from "react";
import { SEASON, scheduleConfig, sessions } from "./config/season";
import { buildSchedule } from "./domain/schedule";
import { useNow } from "./hooks/useNow";
import { useOpenDetailsOnAnchor } from "./hooks/useOpenDetailsOnAnchor";
import { BottomNav } from "./components/layout/BottomNav";
import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteHeader } from "./components/layout/SiteHeader";
import { ThemeModeSwitch } from "./components/layout/ThemeModeSwitch";
import "./components/layout/SiteHeader.css";
import { LiveStatus } from "./components/schedule/LiveStatus";
import { NextSessionCountdown } from "./components/schedule/NextSessionCountdown";
import { RankingLegend } from "./components/schedule/RankingLegend";
import { SessionIndex } from "./components/schedule/SessionIndex";
import { SessionSchedule } from "./components/schedule/SessionSchedule";
import { AuthorSearch } from "./components/search/AuthorSearch";
import { MonitorIcon } from "./components/ui/icons";
import "./App.css";

/**
 * Panel lateral (estado de la sesión, buscador, índice de sesiones y leyenda)
 * y el programa de cada sesión al lado. En móvil el panel va arriba.
 */
function App() {
  const now = useNow();
  const schedule = useMemo(() => buildSchedule(sessions, now, scheduleConfig), [now]);
  useOpenDetailsOnAnchor();

  const { present, upcomingSession } = schedule;
  const isLive = present?.performances.some((p) => p.isLive) ?? false;

  return (
    <>
      <BottomNav liveUrl={SEASON.liveUrl} activeSessionDate={schedule.activeSessionDate} />
      <ThemeModeSwitch />

      <div className="coac-layout">
        <aside className="coac-layout__side" aria-label="Estado de la fase, buscador e índice de sesiones">
          <SiteHeader year={SEASON.year} phaseTitle={SEASON.phaseTitle} variant="sidebar" />
          {present && <LiveStatus session={present} />}
          {!isLive && upcomingSession && (
            <NextSessionCountdown
              label={
                upcomingSession.status === "present"
                  ? `La sesión de hoy empieza a las ${SEASON.sessionStartTime}`
                  : `Próxima sesión: ${upcomingSession.date}`
              }
              targetDate={upcomingSession.startsAt.toISOString()}
            />
          )}
          <a className="coac-layout__live" href={SEASON.liveUrl} target="_blank" rel="noopener noreferrer">
            <MonitorIcon />
            Ver el directo
          </a>
          <AuthorSearch sessions={sessions} />
          <SessionIndex schedule={schedule} />
          <RankingLegend minutesPerGroup={SEASON.minutesPerGroup} />
        </aside>

        <main id="siteMain" className="coac-layout__main">
          <SessionSchedule schedule={schedule} previousYear={SEASON.previousYear} />
        </main>
      </div>
      <SiteFooter />
    </>
  );
}

export default App;
