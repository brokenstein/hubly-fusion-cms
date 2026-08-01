import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
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
  component: () => <div className="text-sm text-muted-foreground">Loading overview…</div>,
});
