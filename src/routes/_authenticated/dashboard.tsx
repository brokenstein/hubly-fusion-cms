import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, MonitorSmartphone, Palette, Calculator } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import type { CaseEntry } from "@/lib/case-types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Overview — OpsKit workspace" },
      {
        name: "description",
        content: "One overview of open cases, tracked devices, brand kits and ROI scenarios.",
      },
      { property: "og:title", content: "Overview — OpsKit workspace" },
      { property: "og:description", content: "Cases, devices, brand kits and ROI at a glance." },
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
    to: "/brand",
    label: "Brand Kits",
    icon: Palette,
    blurb: "Logos, palettes and fonts per account.",
  },
  {
    to: "/roi",
    label: "ROI Calculator",
    icon: Calculator,
    blurb: "Scenario modelling and saved deals.",
  },
] as const;

function Overview() {
  const counts = useQuery({
    queryKey: ["overview-counts"],
    queryFn: async () => {
      const [devices, kits, deals, caseState] = await Promise.all([
        supabase.from("devices").select("id", { count: "exact", head: true }),
        supabase.from("brand_kits").select("id", { count: "exact", head: true }),
        supabase.from("roi_deals").select("id", { count: "exact", head: true }),
        supabase.from("app_state").select("value").eq("key", "dash.cases").maybeSingle(),
      ]);
      const cases = Array.isArray(caseState.data?.value)
        ? (caseState.data!.value as CaseEntry[])
        : [];
      return {
        devices: devices.count ?? 0,
        kits: kits.count ?? 0,
        deals: deals.count ?? 0,
        openCases: cases.filter((c) => c.status !== "closed").length,
      };
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">Workspace overview</h1>
        <p className="text-sm text-muted-foreground">
          Cases, devices, brand kits and ROI deals — all in one place.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Open cases"
          value={counts.data?.openCases ?? 0}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          label="Devices"
          value={counts.data?.devices ?? 0}
          icon={<MonitorSmartphone className="h-5 w-5" />}
        />
        <StatCard
          label="Brand kits"
          value={counts.data?.kits ?? 0}
          icon={<Palette className="h-5 w-5" />}
        />
        <StatCard
          label="Saved deals"
          value={counts.data?.deals ?? 0}
          icon={<Calculator className="h-5 w-5" />}
        />
      </section>

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
