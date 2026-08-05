import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Link2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCloudState } from "@/hooks/use-cloud-state";

export const Route = createFileRoute("/_authenticated/links")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Link Tracker — OpsKit workspace" },
      {
        name: "description",
        content:
          "Embed your Dashy dashboard inside OpsKit so every internal link and service lives next to your cases, devices and monitors.",
      },
      { property: "og:title", content: "Link Tracker — OpsKit workspace" },
      {
        property: "og:description",
        content: "Your Dashy link dashboard, embedded directly in the OpsKit workspace.",
      },
    ],
  }),
  component: LinksPage,
});

function normalize(raw: string) {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function LinksPage() {
  const [url, setUrl, loaded] = useCloudState<string>("dashy_url", "");
  const [draft, setDraft] = useState("");
  const [nonce, setNonce] = useState(0);

  const current = url ?? "";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Link Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Your Dashy dashboard, embedded right here in the workspace.
          </p>
        </div>
        {current && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setNonce((n) => n + 1)}>
              <RefreshCw className="mr-1 size-3.5" /> Reload
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={current} target="_blank" rel="noreferrer">
                Open Dashy <ArrowUpRight className="ml-1 size-3.5" />
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setUrl("")}>
              Change URL
            </Button>
          </div>
        )}
      </header>

      {!loaded && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {loaded && !current && (
        <Card className="mx-auto max-w-lg space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Link2 className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Add your Dashy URL</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dashy-url">Dashy URL</Label>
            <Input
              id="dashy-url"
              value={draft}
              placeholder="https://dashy.mycompany.com"
              onChange={(e) => setDraft(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The site must allow being embedded in an iframe. If it stays blank, open it in a new
              tab instead.
            </p>
          </div>
          <Button
            disabled={!draft.trim()}
            onClick={() => {
              const next = normalize(draft);
              if (!next) return;
              setUrl(next);
              toast.success("Dashy dashboard connected");
            }}
          >
            Embed dashboard
          </Button>
        </Card>
      )}

      {loaded && current && (
        <Card className="overflow-hidden p-0">
          <iframe
            key={`${current}-${nonce}`}
            src={current}
            title="Dashy dashboard"
            className="h-[75vh] w-full border-0 bg-background"
            referrerPolicy="no-referrer"
          />
        </Card>
      )}
    </div>
  );
}
