import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, ImagePlus, Loader2, Pencil, Plus, StickyNote, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCloudState } from "@/hooks/use-cloud-state";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/_authenticated/notes")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Notes — OpsKit workspace" },
      {
        name: "description",
        content:
          "Keep platform details, credentials hints and quick reference notes in named notepads inside your OpsKit workspace.",
      },
      { property: "og:title", content: "Notes — OpsKit workspace" },
      {
        property: "og:description",
        content: "Named notepads for quick-access platform details in OpsKit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotesPage,
});

type NoteImage = { path: string; name: string };

type Notepad = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
  images?: NoteImage[];
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `pad-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const newPad = (title: string): Notepad => ({
  id: uid(),
  title,
  body: "",
  images: [],
  updatedAt: new Date().toISOString(),
});

const BUCKET = "note-images";

/** Renders a stored note image via a short-lived signed URL. */
function NoteImageTile({
  image,
  onRemove,
}: {
  image: NoteImage;
  onRemove: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(image.path, 60 * 60)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("[notes] signed url failed", error);
          return;
        }
        setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [image.path]);

  return (
    <figure className="group relative overflow-hidden rounded-md border bg-muted/30">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img src={url} alt={image.name} loading="lazy" className="h-32 w-full object-cover" />
        </a>
      ) : (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Remove ${image.name}`}
        className="absolute right-1 top-1 size-7 bg-background/80 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </figure>
  );
}


function NotesPage() {
  const [pads, setPads, loaded] = useCloudState<Notepad[]>("notepads", []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const list = pads ?? [];
  const active = list.find((p) => p.id === activeId) ?? list[0] ?? null;

  useEffect(() => {
    const first = list[0];
    if (loaded && first && !list.some((p) => p.id === activeId)) {
      setActiveId(first.id);
    }
  }, [loaded, list, activeId]);


  const addPad = () => {
    const pad = newPad(`Notepad ${list.length + 1}`);
    setPads((prev) => [...(prev ?? []), pad]);
    setActiveId(pad.id);
    setRenamingId(pad.id);
    setRenameDraft(pad.title);
  };

  const updateBody = (id: string, body: string) =>
    setPads((prev) =>
      (prev ?? []).map((p) =>
        p.id === id ? { ...p, body, updatedAt: new Date().toISOString() } : p,
      ),
    );

  const [uploading, setUploading] = useState(false);

  const addImages = useCallback(
    async (padId: string, files: File[]) => {
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) return;
      setUploading(true);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) throw new Error("You need to be signed in to attach images.");

        const uploaded: NoteImage[] = [];
        for (const file of images) {
          const ext = (file.name.split(".").pop() ?? "png").toLowerCase().slice(0, 5);
          const path = `${userId}/${padId}/${uid()}.${ext}`;
          const { error } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, { contentType: file.type, upsert: false });
          if (error) throw error;
          uploaded.push({ path, name: file.name || "Pasted image" });
        }

        setPads((prev) =>
          (prev ?? []).map((p) =>
            p.id === padId
              ? {
                  ...p,
                  images: [...(p.images ?? []), ...uploaded],
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        );
        toast.success(uploaded.length > 1 ? `${uploaded.length} images added` : "Image added");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Image upload failed");
      } finally {
        setUploading(false);
      }
    },
    [setPads],
  );

  const removeImage = async (padId: string, image: NoteImage) => {
    setPads((prev) =>
      (prev ?? []).map((p) =>
        p.id === padId
          ? {
              ...p,
              images: (p.images ?? []).filter((i) => i.path !== image.path),
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
    const { error } = await supabase.storage.from(BUCKET).remove([image.path]);
    if (error) console.error("[notes] image delete failed", error);
  };


  const commitRename = (id: string) => {
    const title = renameDraft.trim();
    if (!title) {
      setRenamingId(null);
      return;
    }
    setPads(list.map((p) => (p.id === id ? { ...p, title } : p)));
    setRenamingId(null);
  };

  const removePad = (id: string) => {
    setPads(list.filter((p) => p.id !== id));
    toast.success("Notepad deleted");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Notes</h1>
          <p className="text-sm text-muted-foreground">
            Quick-access notepads for platform details, steps and reminders.
          </p>
        </div>
        <Button size="sm" onClick={addPad} disabled={!loaded}>
          <Plus className="mr-1 size-3.5" /> New notepad
        </Button>
      </header>

      {!loaded && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {loaded && list.length === 0 && (
        <Card className="mx-auto max-w-lg space-y-3 p-6 text-center">
          <StickyNote className="mx-auto size-5 text-muted-foreground" />
          <p className="text-sm font-medium">No notepads yet</p>
          <p className="text-xs text-muted-foreground">
            Create your first notepad to keep platform details close at hand.
          </p>
          <Button size="sm" onClick={addPad}>
            <Plus className="mr-1 size-3.5" /> New notepad
          </Button>
        </Card>
      )}

      {loaded && list.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <Card className="h-fit p-2">
            <ul className="space-y-1">
              {list.map((pad) => (
                <li key={pad.id}>
                  {renamingId === pad.id ? (
                    <div className="flex items-center gap-1 p-1">
                      <Input
                        autoFocus
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(pad.id);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="h-8"
                        aria-label="Notepad name"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Save name"
                        onClick={() => commitRename(pad.id)}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Cancel rename"
                        onClick={() => setRenamingId(null)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "group flex items-center gap-1 rounded-md px-2 py-1.5",
                        active?.id === pad.id ? "bg-accent" : "hover:bg-accent/50",
                      )}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate text-left text-sm"
                        onClick={() => setActiveId(pad.id)}
                      >
                        {pad.title}
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground"
                        aria-label={`Rename ${pad.title}`}
                        onClick={() => {
                          setRenamingId(pad.id);
                          setRenameDraft(pad.title);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Delete ${pad.title}`}
                        onClick={() => removePad(pad.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          {active && (
            <Card className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold">{active.title}</h2>
                <div className="flex items-center gap-2">
                  {uploading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        void addImages(active.id, Array.from(e.target.files ?? []));
                        e.target.value = "";
                      }}
                    />
                    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-accent">
                      <ImagePlus className="size-3.5" /> Add image
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Saved {new Date(active.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <Textarea
                value={active.body}
                onChange={(e) => updateBody(active.id, e.target.value)}
                onPaste={(e) => {
                  const files = Array.from(e.clipboardData.files).filter((f) =>
                    f.type.startsWith("image/"),
                  );
                  if (files.length > 0) {
                    e.preventDefault();
                    void addImages(active.id, files);
                  }
                }}
                onDrop={(e) => {
                  const files = Array.from(e.dataTransfer.files).filter((f) =>
                    f.type.startsWith("image/"),
                  );
                  if (files.length > 0) {
                    e.preventDefault();
                    void addImages(active.id, files);
                  }
                }}
                placeholder="Platform details, logins to request, escalation steps… paste a screenshot to attach it"
                className="min-h-[45vh] resize-y font-mono text-sm"
              />
              {(active.images?.length ?? 0) > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {(active.images ?? []).map((image) => (
                    <NoteImageTile
                      key={image.path}
                      image={image}
                      onRemove={() => void removeImage(active.id, image)}
                    />
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Changes save automatically. Paste or drop screenshots straight into the notepad.
              </p>
            </Card>
          )}

        </div>
      )}
    </div>
  );
}
