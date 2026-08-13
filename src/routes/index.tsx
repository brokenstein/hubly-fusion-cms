import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardList,
  MonitorSmartphone,
  Activity,
  Link2,
  FileText,
  StickyNote,
  Palette,
  Calculator,
  ArrowRight,
} from "lucide-react";

import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OpsKit — All your operations tools in one workspace" },
      {
        name: "description",
        content:
          "OpsKit unifies case tracking, device management, uptime monitoring, link dashboards, PDF tools, notes, brand kits and ROI calculations behind a single login.",
      },
      { property: "og:title", content: "OpsKit — One workspace for every operations tool" },
      {
        property: "og:description",
        content:
          "Case tracking, device versions, uptime monitoring, link dashboards, PDF tools, notes, brand kits and ROI calculations in one workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    icon: Activity,
    title: "Uptime Monitor",
    body: "Live monitor health and status page previews pulled from your Uptime Kuma instances.",
  },
  {
    icon: Link2,
    title: "Link Tracker",
    body: "Your Dashy dashboard embedded in the workspace so every internal link stays one click away.",
  },
  {
    icon: FileText,
    title: "PDF Tools",
    body: "Embed your PDF toolkit for quick merges, splits, conversions and previews.",
  },
  {
    icon: StickyNote,
    title: "Notes",
    body: "Named notepads for platform details, runbooks and quick reference that persist per workspace.",
  },
  {
    icon: Palette,
    title: "Brand Kits",
    body: "Capture palettes, typography, logos and brand metadata for every client or product.",
  },
  {
    icon: Calculator,
    title: "ROI Calculator",
    body: "Model savings and payback for prospects with adjustable templates and formulas.",
  },
];


function Landing() {
  const google = useGoogleSignIn();

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden border-b border-border surface-grid">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Unified operations CMS
          </p>
          <h1 className="mt-5 font-display text-4xl leading-tight md:text-6xl">
            All your operations tools, <span className="text-gradient-brand">one workspace</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
            OpsKit brings together the Case Tracker, Device Hub, Uptime Monitor, Link Tracker, PDF
            Tools, Notes, Brand Kits and ROI Calculator behind a single login and one shared
            database.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Open workspace <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Create an account</Link>
            </Button>
          </div>
          <div className="mt-3 flex justify-center">
            <Button size="lg" variant="outline" className="gap-2" onClick={google}>
              <GoogleIcon className="size-4" />
              Continue with Google
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
        OpsKit · Cases · Devices · Uptime · Links · PDF Tools · Notes · Brand Kits · ROI
      </footer>
    </main>
  );
}
