import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, FileText, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCloudState } from "@/hooks/use-cloud-state";

export const Route = createFileRoute("/_authenticated/pdf-tools")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "PDF Tools — OpsKit workspace" },
      {
        name: "description",
        content:
          "Embed your PDF toolkit (Stirling PDF, iLovePDF or any web tool) inside OpsKit for quick merges, splits and conversions.",
      },
      { property: "og:title", content: "PDF Tools — OpsKit workspace" },
      {
        property: "og:description",
        content: "Your PDF toolkit, embedded directly in the OpsKit workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PdfToolsPage,
});

function normalize(raw: string) {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function PdfToolsPage() {
  const [url, setUrl, loaded] = useCloudState<string>("pdf_tools_url", "");
  const [draft, setDraft] = useState("");
  const [nonce, setNonce] = useState(0);

  const current = url ?? "";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">PDF Tools</h1>
          <p className="text-sm text-muted-foreground">
            Your PDF toolkit, embedded right here in the workspace.
          </p>
        </div>
        {current && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setNonce((n) => n + 1)}>
              <RefreshCw className="mr-1 size-3.5" /> Reload
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={current} target="_blank" rel="noreferrer">
                Open in new tab <ArrowUpRight className="ml-1 size-3.5" />
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
            <FileText className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Add your PDF tool URL</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pdf-url">PDF tool URL</Label>
            <Input
              id="pdf-url"
              value={draft}
              placeholder="https://pdf.mycompany.com"
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
              toast.success("PDF tool connected");
            }}
          >
            Embed tool
          </Button>
        </Card>
      )}

      {loaded && current && (
        <Card className="overflow-hidden p-0">
          <iframe
            key={`${current}-${nonce}`}
            src={current}
            title="PDF tools"
            className="h-[75vh] w-full border-0 bg-background"
            referrerPolicy="no-referrer"
          />
        </Card>
      )}
    </div>
  );
}
