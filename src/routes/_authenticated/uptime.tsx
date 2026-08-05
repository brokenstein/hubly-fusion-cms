import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  ArrowUpRight,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { getUptimeStatus } from "@/lib/uptime.functions";
import type { UptimeSnapshot } from "@/lib/uptime.server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/uptime")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Uptime Monitor — OpsKit workspace" },
      {
        name: "description",
        content:
          "Live monitor health pulled from your Uptime Kuma status pages: uptime, response time and incident heartbeats.",
      },
      { property: "og:title", content: "Uptime Monitor — OpsKit workspace" },
      {
        property: "og:description",
        content: "Uptime Kuma monitors, uptime percentages and heartbeats in one dashboard.",
      },
    ],
  }),
  component: UptimePage,
});

interface UptimeSite {
  id: string;
  name: string;
  base_url: string;
  status_page_slug: string;
}

function UptimePage() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sites = useQuery({
    queryKey: ["uptime_sites"],
    queryFn: async (): Promise<UptimeSite[]> => {
      const { data, error } = await supabase
        .from("uptime_sites")
        .select("id, name, base_url, status_page_slug")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const list = sites.data ?? [];
  const active = list.find((s) => s.id === activeId) ?? list[0] ?? null;

  useEffect(() => {
    if (!activeId && list.length > 0) setActiveId(list[0]!.id);
  }, [activeId, list]);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("uptime_sites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Uptime Kuma instance removed");
      setActiveId(null);
      queryClient.invalidateQueries({ queryKey: ["uptime_sites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Uptime Monitor</h1>
          <p className="text-sm text-muted-foreground">
            Live monitor health read straight from your Uptime Kuma status pages.
          </p>
        </div>
        <div className="flex gap-2">
          {active && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${active.name}`}
              onClick={() => remove.mutate(active.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
          <AddSiteDialog />
        </div>
      </header>

      {sites.isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!sites.isLoading && list.length === 0 && (
        <Card className="border-dashed p-12 text-center">
          <Activity className="mx-auto mb-3 size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No Uptime Kuma instance connected yet. Add the URL of your Uptime Kuma site and the
            slug of a status page to pull live monitors in.
          </p>
        </Card>
      )}

      {list.length > 1 && (
        <Tabs value={active?.id ?? ""} onValueChange={setActiveId}>
          <TabsList className="h-auto flex-wrap gap-2">
            {list.map((site) => (
              <TabsTrigger key={site.id} value={site.id}>
                {site.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {active && <SiteStatus site={active} />}
    </div>
  );
}

function SiteStatus({ site }: { site: UptimeSite }) {
  const fetchStatus = useServerFn(getUptimeStatus);

  const status = useQuery({
    queryKey: ["uptime_status", site.id],
    queryFn: async (): Promise<UptimeSnapshot> =>
      fetchStatus({ data: { baseUrl: site.base_url, slug: site.status_page_slug } }),
    refetchInterval: 60_000,
    retry: false,
  });

  if (status.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status.isError) {
    return (
      <Card className="space-y-3 border-destructive/40 p-6">
        <p className="text-sm font-medium">Could not reach that Uptime Kuma status page.</p>
        <p className="text-sm text-muted-foreground">
          {(status.error as Error).message} — check the URL, and make sure the status page is
          published and publicly reachable.
        </p>
        <Button variant="outline" size="sm" onClick={() => status.refetch()}>
          <RefreshCw className="mr-1 size-3.5" /> Retry
        </Button>
      </Card>
    );
  }

  const snapshot = status.data!;
  const groups = [...new Set(snapshot.monitors.map((m) => m.groupName))];

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-base font-semibold">{snapshot.title}</h2>
          <p className="text-xs text-muted-foreground">
            {snapshot.monitors.length} monitor{snapshot.monitors.length === 1 ? "" : "s"} ·{" "}
            {snapshot.upCount} up · {snapshot.downCount} down · updated{" "}
            {new Date(snapshot.fetchedAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => status.refetch()}>
            <RefreshCw className="mr-1 size-3.5" /> Refresh
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={snapshot.statusPageUrl} target="_blank" rel="noreferrer">
              Status page <ArrowUpRight className="ml-1 size-3.5" />
            </a>
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
          <p className="text-xs font-medium text-muted-foreground">
            Live status page preview — {snapshot.statusPageUrl.replace(/^https?:\/\//, "")}
          </p>
          <Button asChild variant="ghost" size="sm">
            <a href={snapshot.statusPageUrl} target="_blank" rel="noreferrer">
              Open <ArrowUpRight className="ml-1 size-3.5" />
            </a>
          </Button>
        </div>
        <iframe
          key={snapshot.statusPageUrl}
          src={snapshot.statusPageUrl}
          title={`${snapshot.title} status page`}
          className="h-[70vh] w-full border-0 bg-background"
          referrerPolicy="no-referrer"
        />
      </Card>


      {snapshot.monitors.length === 0 && (
        <Card className="border-dashed p-10 text-center text-sm text-muted-foreground">
          This status page has no public monitors yet.
        </Card>
      )}

      {groups.map((group) => (
        <section key={group} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">{group}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {snapshot.monitors
              .filter((m) => m.groupName === group)
              .map((monitor) => (
                <Card key={monitor.id} className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="truncate text-base font-semibold">{monitor.name}</h4>
                      {monitor.url && (
                        <a
                          href={monitor.url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-xs text-primary hover:underline"
                        >
                          {monitor.url.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                    </div>
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
                  </div>

                  <div className="flex gap-0.5" aria-label="Recent heartbeats">
                    {monitor.beats.map((beat, i) => (
                      <span
                        key={`${monitor.id}-${i}`}
                        title={`${beat.time}${beat.ping ? ` · ${beat.ping} ms` : ""}`}
                        className={`h-6 flex-1 rounded-sm ${
                          beat.status === 1
                            ? "bg-primary"
                            : beat.status === 0
                              ? "bg-destructive"
                              : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {monitor.uptime24h !== null
                      ? `${monitor.uptime24h.toFixed(2)}% uptime (24h)`
                      : "Uptime unavailable"}
                    {monitor.avgPing !== null ? ` · ${monitor.avgPing} ms avg` : ""}
                  </p>
                </Card>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function AddSiteDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", base_url: "", status_page_slug: "default" });

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("uptime_sites").insert({
        user_id: auth.user!.id,
        name: form.name.trim(),
        base_url: form.base_url.trim(),
        status_page_slug: form.status_page_slug.trim() || "default",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Uptime Kuma instance connected");
      queryClient.invalidateQueries({ queryKey: ["uptime_sites"] });
      setForm({ name: "", base_url: "", status_page_slug: "default" });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 size-4" /> Add Uptime Kuma
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect an Uptime Kuma instance</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="uptime-name">Label</Label>
            <Input
              id="uptime-name"
              value={form.name}
              placeholder="Production Kuma"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uptime-url">Uptime Kuma URL</Label>
            <Input
              id="uptime-url"
              value={form.base_url}
              placeholder="https://kuma.mycompany.com"
              onChange={(e) => setForm({ ...form, base_url: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uptime-slug">Status page slug</Label>
            <Input
              id="uptime-slug"
              value={form.status_page_slug}
              placeholder="default"
              onChange={(e) => setForm({ ...form, status_page_slug: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              The last part of your status page URL, e.g. <code>/status/default</code>. The status
              page must be published so its data can be read.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!form.name.trim() || !form.base_url.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
