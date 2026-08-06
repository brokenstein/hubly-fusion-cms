import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Briefcase, Clock, Timer, CalendarDays } from "lucide-react";

import { useCloudState } from "@/hooks/use-cloud-state";
import { StatCard } from "@/components/dashboard/StatCard";
import { CasesPanel } from "@/components/dashboard/CasesPanel";
import { TimeCardPanel } from "@/components/dashboard/TimeCardPanel";
import { PtoPanel } from "@/components/dashboard/PtoPanel";
import { DailyInfoPanel } from "@/components/dashboard/DailyInfoPanel";
import { HistoryPanel } from "@/components/dashboard/HistoryPanel";
import { NewCasesCounter } from "@/components/dashboard/NewCasesCounter";
import type { CaseEntry, DayHistory, PtoEntry, PunchEntry } from "@/lib/case-types";

export const Route = createFileRoute("/_authenticated/cases")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Case Tracker — OpsKit workspace" },
      {
        name: "description",
        content:
          "Track support cases, minutes worked, time-card punches, PTO usage and daily history in one place.",
      },
      { property: "og:title", content: "Case Tracker — OpsKit workspace" },
      {
        property: "og:description",
        content: "Cases, minutes, punches, PTO and daily history, synced to your workspace.",
      },
    ],
  }),
  component: CasesPage,
});

const DEFAULT_INFO = `Account:
POC:
Issue:

Steps Taken:
Reviewing case and issue at hand -

RCA:
1. What was the reported issue?
2. What was the root cause of the issue?
3. What steps did you take to resolve the issue?`;

function hoursBetween(a: string, b: string) {
  if (!a || !b) return 0;
  const [ah = 0, am = 0] = a.split(":").map(Number);
  const [bh = 0, bm = 0] = b.split(":").map(Number);
  const mins = bh * 60 + bm - (ah * 60 + am);
  return mins > 0 ? mins / 60 : 0;
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function caseDate(caseEntry: CaseEntry) {
  return caseEntry.createdAt ? localDateKey(new Date(caseEntry.createdAt)) : "";
}

function CasesPage() {
  const [cases, setCases, casesLoaded] = useCloudState<CaseEntry[]>("dash.cases", []);
  const [punches, setPunches] = useCloudState<PunchEntry[]>("dash.punches", []);
  const [pto, setPto] = useCloudState<PtoEntry[]>("dash.pto", []);
  const [ptoBalance, setPtoBalance] = useCloudState<number>("dash.ptoBalance", 80);
  const [info, setInfo] = useCloudState<string>("dash.info", DEFAULT_INFO);
  const [history, setHistory] = useCloudState<DayHistory[]>("dash.history", []);
  const [lastDate, setLastDate, lastDateLoaded] = useCloudState<string>("dash.lastDate", "");
  const [newCases, setNewCases, newCasesLoaded] = useCloudState<{ date: string; count: number }>(
    "dash.newCases",
    { date: "", count: 0 },
  );

  const [today, setToday] = useState<string>("");
  const [todayLabel, setTodayLabel] = useState<string>("");
  useEffect(() => {
    const d = new Date();
    setToday(localDateKey(d));
    setTodayLabel(
      d.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    );
  }, []);

  useEffect(() => {
    if (!today) return;
    if (!casesLoaded || !lastDateLoaded) return;
    if (lastDate !== today) {
      setCases(cases.filter((caseEntry) => caseDate(caseEntry) === today));
      setLastDate(today);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, lastDate, casesLoaded, lastDateLoaded]);

  const todayCases = useMemo(
    () => cases.filter((caseEntry) => caseDate(caseEntry) === today),
    [cases, today],
  );

  const setTodayCases = (nextCases: CaseEntry[]) => {
    const olderCases = cases.filter((caseEntry) => caseDate(caseEntry) !== today);
    setCases([...nextCases, ...olderCases]);
  };

  useEffect(() => {
    if (!today || !newCasesLoaded) return;
    if (newCases.date !== today) setNewCases({ date: today, count: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, newCasesLoaded]);

  const newCasesCount = newCases.date === today ? newCases.count : 0;
  const updateNewCasesCount = (n: number) => setNewCases({ date: today, count: n });

  const LUNCH_HOURS = 1;

  const stats = useMemo(() => {
    const totalMin = todayCases.reduce((s, c) => s + (c.minutes || 0), 0);
    const rawHours = punches
      .filter((p) => p.date === today)
      .reduce((s, p) => s + hoursBetween(p.punchIn, p.punchOut), 0);
    const todayHours = rawHours > LUNCH_HOURS ? rawHours - LUNCH_HOURS : 0;
    const ptoUsed = pto.reduce((s, p) => s + p.hours, 0);
    return {
      caseCount: todayCases.length,
      totalMin,
      avgMin: todayCases.length ? Math.round(totalMin / todayCases.length) : 0,
      todayHours,
      rawHours,
      ptoUsed,
    };
  }, [todayCases, punches, pto, today]);

  useEffect(() => {
    if (!today) return;
    const byStatus = { touched: 0, working: 0, other: 0, closed: 0 };
    todayCases.forEach((c) => {
      byStatus[c.status]++;
    });
    const ptoToday = pto.filter((p) => p.date === today).reduce((s, p) => s + p.hours, 0);

    const snapshot: DayHistory = {
      date: today,
      caseCount: todayCases.length,
      totalMinutes: stats.totalMin,
      byStatus,
      hoursWorked: stats.todayHours,
      ptoUsed: ptoToday,
      newCasesAdded: newCasesCount,
      cases: todayCases.map((c) => ({
        title: c.title,
        account: c.account,
        minutes: c.minutes,
        status: c.status,
        notes: c.notes,
      })),
      updatedAt: new Date().toISOString(),
    };

    const hasData =
      snapshot.caseCount > 0 ||
      snapshot.totalMinutes > 0 ||
      snapshot.hoursWorked > 0 ||
      snapshot.ptoUsed > 0 ||
      (snapshot.newCasesAdded ?? 0) > 0;

    const existing = history.find((h) => h.date === today);
    if (!hasData && !existing) return;

    if (
      existing &&
      JSON.stringify({ ...existing, updatedAt: 0 }) ===
        JSON.stringify({ ...snapshot, updatedAt: 0 })
    ) {
      return;
    }

    setHistory([snapshot, ...history.filter((h) => h.date !== today)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayCases, punches, pto, today, newCasesCount]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">Case Tracker</h1>
        <p className="text-sm text-muted-foreground">{todayLabel || "Today"}</p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <NewCasesCounter count={newCasesCount} onChange={updateNewCasesCount} />
        <StatCard
          label="Cases tracked"
          value={stats.caseCount}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <StatCard
          label="Total minutes"
          value={stats.totalMin}
          hint={`Avg ${stats.avgMin} min/case`}
          icon={<Timer className="h-5 w-5" />}
        />
        <StatCard
          label="Hours today"
          value={stats.todayHours.toFixed(2)}
          hint={
            stats.rawHours > 0
              ? `${stats.rawHours.toFixed(2)}h punched · −1h lunch`
              : "−1h lunch auto-deducted"
          }
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          label="PTO used"
          value={`${stats.ptoUsed}h`}
          hint={`${Math.max(ptoBalance - stats.ptoUsed, 0)}h remaining`}
          icon={<CalendarDays className="h-5 w-5" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CasesPanel cases={todayCases} setCases={setTodayCases} />
        </div>
        <DailyInfoPanel info={info} setInfo={setInfo} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TimeCardPanel punches={punches} setPunches={setPunches} />
        <PtoPanel
          pto={pto}
          setPto={setPto}
          ptoBalance={ptoBalance}
          setPtoBalance={setPtoBalance}
        />
      </section>

      <section className="space-y-6">
        <NewCasesLog history={history} today={today} todayCount={newCasesCount} />
        <HistoryPanel history={history} setHistory={setHistory} />
      </section>

    </div>
  );
}
