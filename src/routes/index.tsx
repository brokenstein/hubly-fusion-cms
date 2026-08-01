import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, MonitorSmartphone, Palette, Calculator, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OpsKit — Cases, Devices, Brand & ROI in one CMS" },
      {
        name: "description",
        content:
          "OpsKit merges case tracking, a device software matrix, brand kit management and sales ROI modeling into one workspace with a single login.",
      },
      { property: "og:title", content: "OpsKit — One CMS for four workflows" },
      {
        property: "og:description",
        content: "Case tracking, device versions, brand kits and ROI modeling in one workspace.",
      },
    ],
  }),
  component: Landing,
});

const modules = [
  {
    icon: ClipboardList,
    title: "Case Tracker",
    body: "Log cases, minutes worked and color-coded status, then read the trends back as charts.",
  },
  {
    icon: MonitorSmartphone,
    title: "Device Hub",
    body: "A searchable catalog of devices and the software versions approved for each one.",
  },
  {
    icon: Palette,
    title: "Brand Kits",
    body: "Capture palettes, typography and tokens as reusable brand guides and design systems.",
  },
  {
    icon: Calculator,
    title: "ROI Calculator",
    body: "Model savings and payback for a prospect, then save the scenario to share later.",
  },
];

function Landing() {
  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden border-b border-border surface-grid">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Unified operations CMS
          </p>
          <h1 className="mt-5 font-display text-4xl leading-tight md:text-6xl">
            Four of your tools, <span className="text-gradient-brand">one workspace</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
            OpsKit combines the Case Tracker, Device Hub, Brand Kit builder and Sales ROI
            Calculator behind a single login and one shared database.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Open workspace <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Create an account</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-2xl">What's inside</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {modules.map((m) => (
            <article key={m.title} className="panel p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <m.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg">{m.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{m.body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        OpsKit · Cases · Devices · Brand · ROI
      </footer>
    </main>
  );
}
