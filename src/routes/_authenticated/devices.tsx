import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Cpu,
  Download,
  FolderOpen,
  Layers,
  Loader2,
  Monitor,
  MonitorSmartphone,
  Plus,
  Trash2,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/devices")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Device Hub — OpsKit workspace" },
      {
        name: "description",
        content:
          "Registry of hardware devices grouped by platform, with models, operating systems and software versions.",
      },
      { property: "og:title", content: "Device Hub — OpsKit workspace" },
      {
        property: "og:description",
        content: "Every device, platform and software version in one registry.",
      },
    ],
  }),
  component: DevicesPage,
});

interface SoftwareVersion {
  id: string;
  name: string;
  version: string;
}
interface Device {
  id: string;
  name: string;
  model: string;
  os: string;
  image_url: string | null;
  download_url: string | null;
  platform_id: string | null;
  software_versions: SoftwareVersion[];
}
interface Platform {
  id: string;
  name: string;
}

const UNASSIGNED = "unassigned";

function DevicesPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string>("all");

  const platforms = useQuery({
    queryKey: ["platforms"],
    queryFn: async (): Promise<Platform[]> => {
      const { data, error } = await supabase
        .from("platforms")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const devices = useQuery({
    queryKey: ["devices"],
    queryFn: async (): Promise<Device[]> => {
      const { data: rows, error } = await supabase
        .from("devices")
        .select("id, name, model, os, image_url, download_url, platform_id")
        .order("created_at");
      if (error) throw error;
      const { data: versions, error: vErr } = await supabase
        .from("software_versions")
        .select("id, name, version, device_id");
      if (vErr) throw vErr;
      return (rows ?? []).map((d) => ({
        ...d,
        software_versions: (versions ?? [])
          .filter((v) => v.device_id === d.id)
          .map(({ id, name, version }) => ({ id, name, version })),
      }));
    },
  });

  const addPlatform = useMutation({
    mutationFn: async (name: string) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("platforms")
        .insert({ name, user_id: auth.user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Platform added");
      queryClient.invalidateQueries({ queryKey: ["platforms"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeDevice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("devices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Device removed");
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = devices.data ?? [];
  const filtered =
    selected === "all"
      ? list
      : selected === UNASSIGNED
        ? list.filter((d) => !d.platform_id)
        : list.filter((d) => d.platform_id === selected);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Device Hub</h1>
          <p className="text-sm text-muted-foreground">
            Registered players, platforms and the software versions they run.
          </p>
        </div>
        <div className="flex gap-2">
          <AddPlatformDialog onSubmit={(name) => addPlatform.mutate(name)} />
          <AddDeviceDialog platforms={platforms.data ?? []} />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Layers className="size-5 text-primary" />
          <span className="text-sm">
            <span className="font-semibold text-foreground">{list.length}</span> Registered Devices
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <FolderOpen className="size-5 text-primary" />
          <span className="text-sm">
            <span className="font-semibold text-foreground">{platforms.data?.length ?? 0}</span>{" "}
            Platforms
          </span>
        </div>
      </div>

      {devices.isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      )}

      {!devices.isLoading && (
        <Tabs value={selected} onValueChange={setSelected}>
          <TabsList className="mb-2 h-auto flex-wrap gap-2">
            <TabsTrigger value="all">All ({list.length})</TabsTrigger>
            {(platforms.data ?? []).map((p) => (
              <TabsTrigger key={p.id} value={p.id}>
                {p.name} ({list.filter((d) => d.platform_id === p.id).length})
              </TabsTrigger>
            ))}
            {list.some((d) => !d.platform_id) && (
              <TabsTrigger value={UNASSIGNED}>
                Unassigned ({list.filter((d) => !d.platform_id).length})
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      )}

      {!devices.isLoading && filtered.length === 0 && (
        <Card className="border-dashed p-12 text-center">
          <MonitorSmartphone className="mx-auto mb-3 size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No devices here yet. Use “Add device” to register one.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((device) => (
          <article key={device.id} className="device-card">
            <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-secondary to-muted p-6">
              {device.image_url ? (
                <img
                  src={device.image_url}
                  alt={`${device.name} device photo`}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain drop-shadow-2xl"
                />
              ) : (
                <Monitor className="size-20 text-muted-foreground/50" />
              )}
              <div className="absolute right-2 top-2">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${device.name}`}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeDevice.mutate(device.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold">{device.name}</h2>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Cpu className="size-4" />
                    <span className="truncate">{device.model}</span>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  <Monitor className="size-3.5" /> Active
                </span>
              </div>

              <div className="mb-4 flex items-center justify-between gap-2">
                {device.os ? <span className="version-badge">{device.os}</span> : <span />}
                {device.download_url && (
                  <a
                    href={device.download_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary transition-colors hover:text-primary/80"
                  >
                    <Download className="size-3.5" /> Download
                  </a>
                )}
              </div>

              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Software Versions</h3>
              <div className="overflow-hidden rounded-lg bg-secondary/50">
                {device.software_versions.length > 0 ? (
                  <table className="w-full table-fixed text-sm">
                    <tbody>
                      {device.software_versions.map((v, index) => (
                        <tr
                          key={v.id}
                          className={`transition-colors hover:bg-primary/5 ${
                            index % 2 === 0 ? "bg-transparent" : "bg-secondary/60"
                          }`}
                        >
                          <td className="truncate px-4 py-2.5 font-medium">{v.name}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono font-medium text-primary">
                            {v.version}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    No software versions registered
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

    </div>
  );
}

function AddPlatformDialog({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-1 size-4" /> Platform
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New platform</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="platform-name">Name</Label>
          <Input
            id="platform-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Digital Signage"
          />
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (!name.trim()) return;
              onSubmit(name.trim());
              setName("");
              setOpen(false);
            }}
          >
            Add platform
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddDeviceDialog({ platforms }: { platforms: Platform[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    model: "",
    os: "",
    image_url: "",
    download_url: "",
    platform_id: UNASSIGNED,
    software: "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { data: device, error } = await supabase
        .from("devices")
        .insert({
          user_id: auth.user!.id,
          name: form.name,
          model: form.model,
          os: form.os,
          image_url: form.image_url || null,
          download_url: form.download_url || null,
          platform_id: form.platform_id === UNASSIGNED ? null : form.platform_id,
        })
        .select("id")
        .single();
      if (error) throw error;

      const versions = form.software
        .split(",")
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((chunk) => {
          const parts = chunk.split(/\s+/);
          const version = parts.length > 1 ? parts.pop()! : "";
          return { device_id: device.id, name: parts.join(" "), version };
        });
      if (versions.length) {
        const { error: vErr } = await supabase.from("software_versions").insert(versions);
        if (vErr) throw vErr;
      }
    },
    onSuccess: () => {
      toast.success("Device registered");
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      setForm({
        name: "",
        model: "",
        os: "",
        image_url: "",
        download_url: "",
        platform_id: UNASSIGNED,
        software: "",
      });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 size-4" /> Add device
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register a device</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {(
            [
              ["name", "Name", "BrightSign XT244"],
              ["model", "Model", "XT244"],
              ["os", "Operating system", "BrightSignOS 9"],
              ["image_url", "Image URL", "https://…"],
              ["download_url", "Firmware / download URL", "https://…"],
            ] as const
          ).map(([key, label, placeholder]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`device-${key}`}>{label}</Label>
              <Input
                id={`device-${key}`}
                value={form[key]}
                placeholder={placeholder}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label>Platform</Label>
            <Select
              value={form.platform_id}
              onValueChange={(v) => setForm({ ...form, platform_id: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {platforms.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="device-software">Software versions</Label>
            <Input
              id="device-software"
              value={form.software}
              placeholder="Player 4.2, Firmware 9.0.1"
              onChange={(e) => setForm({ ...form, software: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Comma separated — last word of each entry is used as the version.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!form.name.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            Save device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
