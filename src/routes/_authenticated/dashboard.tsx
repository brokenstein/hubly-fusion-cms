import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  ArrowUpRight,
  Calculator,
  ClipboardList,
  FileText,
  Link2,
  MonitorSmartphone,
  Palette,
  RefreshCw,
  StickyNote,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { getUptimeStatus } from "@/lib/uptime.functions";
import type { UptimeSnapshot } from "@/lib/uptime.server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import type { CaseEntry, DayHistory } from "@/lib/case-types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Overview — OpsKit workspace" },
      {
        name: "description",
        content:
          "One overview of open cases, new cases logged today, tracked devices, live uptime monitors, link dashboards, PDF tools, notes, brand kits and ROI calculations.",
      },
      { property: "og:title", content: "Overview — OpsKit workspace" },
      {
        property: "og:description",
        content:
          "Cases, devices, uptime monitors, link dashboards, PDF tools, notes, brand kits and ROI calculations at a glance.",
      },
    ],
  }),
  component: Overview,
});

const modules = [
  {
    to: "/cases",
    label: "Case Tracker",
    icon: ClipboardList,
    blurb: "Cases, minutes, punches, PTO and daily history.",
  },
  {
    to: "/devices",
    label: "Device Hub",
    icon: MonitorSmartphone,
    blurb: "Devices grouped by platform with software versions.",
  },
  {
    to: "/uptime",
    label: "Uptime Monitor",
    icon: Activity,
    blurb: "Live monitor health from your Uptime Kuma instances.",
  },
  {
    to: "/links",
    label: "Link Tracker",
    icon: Link2,
    blurb: "Your Dashy dashboard embedded right in the workspace.",
  },
  {
    to: "/pdf-tools",
    label: "PDF Tools",
    icon: FileText,
    blurb: "Embedded PDF toolkit for merges, splits and conversions.",
  },
  {
    to: "/notes",
    label: "Notes",
    icon: StickyNote,
    blurb: "Named notepads for platform details and quick reference.",
  },
  {
    to: "/brand",
    label: "Brand Kits",
    icon: Palette,
    blurb: "Palettes, typography and logos captured per brand.",
  },
  {
    to: "/roi",
    label: "ROI Calculator",
    icon: Calculator,
    blurb: "Model savings and payback for a prospect.",
  },
] as const;

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function Overview() {
  const counts = useQuery({
    queryKey: ["overview-counts"],
    queryFn: async () => {
      const [devices, caseState, newCaseState, historyState] = await Promise.all([
        supabase.from("devices").select("id", { count: "exact", head: true }),
        supabase.from("app_state").select("value").eq("key", "dash.cases").maybeSingle(),
        supabase.from("app_state").select("value").eq("key", "dash.newCases").maybeSingle(),
        supabase.from("app_state").select("value").eq("key", "dash.history").maybeSingle(),
      ]);
      const cases = Array.isArray(caseState.data?.value)
        ? (caseState.data!.value as unknown as CaseEntry[])
        : [];
      const history = Array.isArray(historyState.data?.value)
        ? (historyState.data!.value as unknown as DayHistory[])
        : [];
      const today = localDateKey();
      const newToday = newCaseState.data?.value as { date?: string; count?: number } | undefined;
      const weekAgo = localDateKey(new Date(Date.now() - 6 * 86_400_000));
      return {
        devices: devices.count ?? 0,
        openCases: cases.filter((c) => c.status !== "closed").length,
        newToday: newToday?.date === today ? (newToday.count ?? 0) : 0,
        newLast7: history
          .filter((h) => h.date >= weekAgo && h.date <= today)
          .reduce((sum, h) => sum + (h.newCasesAdded ?? 0), 0),
      };
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">Workspace overview</h1>
        <p className="text-sm text-muted-foreground">
          Cases, devices, uptime, links, PDF tools, notes, brand kits and ROI calculators — all in
          one place.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Open cases"
          value={counts.data?.openCases ?? 0}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          label="New cases today"
          value={counts.data?.newToday ?? 0}
          hint={`${counts.data?.newLast7 ?? 0} in the last 7 days`}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          label="Devices"
          value={counts.data?.devices ?? 0}
          icon={<MonitorSmartphone className="h-5 w-5" />}
        />
        <UptimeStatCard />
      </section>

      <UptimeOverview />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {modules.map((m) => (
          <Link key={m.to} to={m.to}>
            <Card className="h-full space-y-2 p-6 transition hover:bg-secondary/40">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <m.icon className="size-4" />
              </span>
              <h2 className="text-base font-semibold">{m.label}</h2>
              <p className="text-sm text-muted-foreground">{m.blurb}</p>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}

function useFirstUptimeSnapshot() {
  const fetchStatus = useServerFn(getUptimeStatus);

  const site = useQuery({
    queryKey: ["overview-uptime-site"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("uptime_sites")
        .select("id, name, base_url, status_page_slug")
        .order("sort_order")
        .order("created_at")
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  const snapshot = useQuery({
    queryKey: ["overview-uptime-status", site.data?.id],
    enabled: !!site.data,
    retry: false,
    refetchInterval: 60_000,
    queryFn: async (): Promise<UptimeSnapshot> =>
      fetchStatus({
        data: { baseUrl: site.data!.base_url, slug: site.data!.status_page_slug },
      }),
  });

  return { site, snapshot };
}

function UptimeStatCard() {
  const { snapshot } = useFirstUptimeSnapshot();
  const data = snapshot.data;
  return (
    <StatCard
      label="Monitors up"
      value={data ? `${data.upCount}/${data.monitors.length}` : "—"}
      hint={data ? (data.downCount > 0 ? `${data.downCount} down` : "All systems normal") : "Uptime Monitor"}
      icon={<Activity className="h-5 w-5" />}
    />
  );
}

function UptimeOverview() {
  const { site, snapshot } = useFirstUptimeSnapshot();

  if (!site.data) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 border-dashed p-6">
        <div>
          <h2 className="text-base font-semibold">Uptime Monitor</h2>
          <p className="text-sm text-muted-foreground">
            No Uptime Kuma instance connected yet.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/uptime">
            Connect one <ArrowUpRight className="ml-1 size-3.5" />
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{site.data.name} — uptime</h2>
          <p className="text-xs text-muted-foreground">
            {snapshot.data
              ? `${snapshot.data.upCount} up · ${snapshot.data.downCount} down · updated ${new Date(
                  snapshot.data.fetchedAt,
                ).toLocaleTimeString()}`
              : snapshot.isError
                ? "Could not reach that Uptime Kuma instance."
                : "Loading monitors…"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => snapshot.refetch()}>
            <RefreshCw className="mr-1 size-3.5" /> Refresh
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/uptime">
              Open monitor <ArrowUpRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {snapshot.data && snapshot.data.monitors.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {snapshot.data.monitors.slice(0, 9).map((monitor) => (
            <div
              key={monitor.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-secondary/40 px-3 py-2"
            >
              <span className="truncate text-sm font-medium">{monitor.name}</span>
              <span className="flex shrink-0 items-center gap-2">
                {monitor.uptime24h !== null && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {monitor.uptime24h.toFixed(1)}%
                  </span>
                )}
                <Badge
                  variant={
                    monitor.status === "up"
                      ? "secondary"
                      : monitor.status === "down"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {monitor.status}
                </Badge>
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
