import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Palette, Plus, Sparkles, Trash2 } from "lucide-react";

import { extractBrandKit } from "@/lib/brand.functions";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/brand")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Brand Kits — OpsKit workspace" },
      {
        name: "description",
        content:
          "Store brand kits with logos, colour palettes, fonts and notes, ready to attach to ROI reports.",
      },
      { property: "og:title", content: "Brand Kits — OpsKit workspace" },
      {
        property: "og:description",
        content: "Logos, palettes and fonts for every account you work with.",
      },
    ],
  }),
  component: BrandPage,
});

interface BrandKit {
  id: string;
  name: string;
  source_url: string | null;
  logo_url: string | null;
  colors: string[];
  fonts: string[];
  notes: string | null;
}

function BrandPage() {
  const queryClient = useQueryClient();

  const kits = useQuery({
    queryKey: ["brand_kits"],
    queryFn: async (): Promise<BrandKit[]> => {
      const { data, error } = await supabase
        .from("brand_kits")
        .select("id, name, source_url, logo_url, colors, fonts, notes")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((k) => ({
        ...k,
        colors: Array.isArray(k.colors) ? (k.colors as string[]) : [],
        fonts: Array.isArray(k.fonts) ? (k.fonts as string[]) : [],
      }));
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("brand_kits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Brand kit deleted");
      queryClient.invalidateQueries({ queryKey: ["brand_kits"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Brand Kits</h1>
          <p className="text-sm text-muted-foreground">
            Logos, palettes and fonts you can attach to ROI reports.
          </p>
        </div>
        <NewKitDialog />
      </header>

      {kits.isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!kits.isLoading && (kits.data?.length ?? 0) === 0 && (
        <Card className="border-dashed p-12 text-center">
          <Palette className="mx-auto mb-3 size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No brand kits yet. Create one to capture a customer's colours and fonts.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(kits.data ?? []).map((kit) => (
          <Card key={kit.id} className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                {kit.logo_url && (
                  <img
                    src={kit.logo_url}
                    alt={`${kit.name} logo`}
                    loading="lazy"
                    className="size-10 rounded-md object-contain"
                  />
                )}
                <div>
                  <h2 className="text-base font-semibold">{kit.name}</h2>
                  {kit.source_url && (
                    <a
                      href={kit.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      {kit.source_url.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Delete ${kit.name}`}
                onClick={() => remove.mutate(kit.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            {kit.colors.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {kit.colors.map((c) => (
                  <span
                    key={c}
                    title={c}
                    className="size-7 rounded-md border border-border"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
            {kit.fonts.length > 0 && (
              <p className="text-xs text-muted-foreground">{kit.fonts.join(" · ")}</p>
            )}
            {kit.notes && <p className="text-sm text-muted-foreground">{kit.notes}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}

function NewKitDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    source_url: "",
    logo_url: "",
    colors: "",
    fonts: "",
    notes: "",
  });

  const runExtract = useServerFn(extractBrandKit);
  const extract = useMutation({
    mutationFn: async () => runExtract({ data: { url: form.source_url } }),
    onSuccess: (kit) => {
      setForm((prev) => ({
        ...prev,
        name: prev.name || kit.name,
        source_url: kit.source_url,
        logo_url: kit.logo_url ?? prev.logo_url,
        colors: kit.colors.join(", ") || prev.colors,
        fonts: kit.fonts.join(", ") || prev.fonts,
        notes: kit.notes || prev.notes,
      }));
      toast.success("Brand details pulled from the website");
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("brand_kits").insert({
        user_id: auth.user!.id,
        name: form.name,
        source_url: form.source_url || null,
        logo_url: form.logo_url || null,
        colors: form.colors
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        fonts: form.fonts
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Brand kit saved");
      queryClient.invalidateQueries({ queryKey: ["brand_kits"] });
      setForm({ name: "", source_url: "", logo_url: "", colors: "", fonts: "", notes: "" });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 size-4" /> New brand kit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New brand kit</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {(
            [
              ["name", "Name", "Acme Corp"],
              ["source_url", "Website", "https://acme.com"],
              ["logo_url", "Logo URL", "https://acme.com/logo.svg"],
              ["colors", "Colours (comma separated)", "#0f172a, #14b8a6"],
              ["fonts", "Fonts (comma separated)", "Space Grotesk, DM Sans"],
            ] as const
          ).map(([key, label, placeholder]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`kit-${key}`}>{label}</Label>
              <Input
                id={`kit-${key}`}
                value={form[key]}
                placeholder={placeholder}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="kit-notes">Notes</Label>
            <Textarea
              id="kit-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!form.name.trim() || save.isPending} onClick={() => save.mutate()}>
            {save.isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
            Save kit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
