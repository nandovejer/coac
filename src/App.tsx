import { useMemo } from "react";
import { SEASON, scheduleConfig, sessions } from "./config/season";
import { buildSchedule } from "./domain/schedule";
import { useNow } from "./hooks/useNow";
import { useOpenDetailsOnAnchor } from "./hooks/useOpenDetailsOnAnchor";
import { BottomNav } from "./components/layout/BottomNav";
import { SiteFooter } from "./components/layout/SiteFooter";
import { Hero } from "./components/layout/Hero";
import { CountdownTicker } from "./components/layout/CountdownTicker";
import { TopBar } from "./components/layout/TopBar";
import { formatSessionTitleDate } from "./lib/dates";
import "./components/layout/SiteHeader.css";
import { LiveStatus } from "./components/schedule/LiveStatus";
import { NextSessionCountdown } from "./components/schedule/NextSessionCountdown";
import { RankingLegend } from "./components/schedule/RankingLegend";
import { SessionIndex } from "./components/schedule/SessionIndex";
import { SessionSchedule } from "./components/schedule/SessionSchedule";
import { SearchSection } from "./components/search/SearchSection";
import { MonitorIcon } from "./components/ui/icons";
import "./App.css";

/**
 * Hero arriba (título, descripción y cuenta atrás), luego el buscador y debajo el panel lateral (estado de la sesión, índice de sesiones y leyenda)
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
      <TopBar year={SEASON.year} phaseTitle={SEASON.phaseTitle}>
        {!isLive && upcomingSession && (
          <CountdownTicker
            label={
              upcomingSession.status === "present"
                ? `Sesión de hoy · ${SEASON.sessionStartTime}`
                : `Próxima sesión · ${formatSessionTitleDate(upcomingSession.date)} · ${SEASON.sessionStartTime}`
            }
            targetDate={upcomingSession.startsAt.toISOString()}
          />
        )}
      </TopBar>
      <BottomNav liveUrl={SEASON.liveUrl} activeSessionDate={schedule.activeSessionDate} />

      <Hero
        year={SEASON.year}
        phaseTitle={SEASON.phaseTitle}
        description="Las agrupaciones de cada sesión en su orden de actuación, con la hora estimada de cada una y el acceso al directo."
      >
        {!isLive && upcomingSession && (
          <NextSessionCountdown targetDate={upcomingSession.startsAt.toISOString()} />
        )}
      </Hero>

      <SearchSection sessions={sessions} schedule={schedule} />

      <div className="coac-layout">
        <aside
          className="coac-layout__side coac-scrollbar coac-scrollbar--on-header"
          aria-label="Estado de la fase e índice de sesiones"
        >
          {present && <LiveStatus session={present} />}
          <a className="coac-layout__live" href={SEASON.liveUrl} target="_blank" rel="noopener noreferrer">
            <MonitorIcon />
            Ver el directo
          </a>
          <SessionIndex schedule={schedule} />
          <RankingLegend minutesPerGroup={SEASON.minutesPerGroup} placement="side" />
        </aside>

        <main id="siteMain" className="coac-layout__main">
          <RankingLegend minutesPerGroup={SEASON.minutesPerGroup} placement="main" />
          <SessionSchedule schedule={schedule} previousYear={SEASON.previousYear} />
        </main>
      </div>
      <SiteFooter />
    </>
  );
}

export default App;
