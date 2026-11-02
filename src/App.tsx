import { useMemo } from "react";
import { SEASON, scheduleConfig, sessions } from "./config/season";
import { buildSchedule } from "./domain/schedule";
import { useNow } from "./hooks/useNow";
import { BottomNav } from "./components/layout/BottomNav";
import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteHeader } from "./components/layout/SiteHeader";
import { ThemeModeSwitch } from "./components/layout/ThemeModeSwitch";
import "./components/layout/SiteHeader.css";
import { SessionSchedule } from "./components/schedule/SessionSchedule";
import { AuthorSearch } from "./components/search/AuthorSearch";

function App() {
  const now = useNow();
  const schedule = useMemo(() => buildSchedule(sessions, now, scheduleConfig), [now]);

  return (
    <>
      <BottomNav liveUrl={SEASON.liveUrl} activeSessionDate={schedule.activeSessionDate} />
      <ThemeModeSwitch />
      <SiteHeader year={SEASON.year} phaseTitle={SEASON.phaseTitle} />

      <main id="siteMain">
        <AuthorSearch sessions={sessions} />
        <SessionSchedule schedule={schedule} />
      </main>
      <SiteFooter />
    </>
  );
}

export default App;
