import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { STATUS_META, type CaseEntry, type CaseStatus } from "@/lib/case-types";

interface Props {
  cases: CaseEntry[];
  setCases: (c: CaseEntry[]) => void;
}

export function CasesPanel({ cases, setCases }: Props) {
  const [filter, setFilter] = useState<CaseStatus | "all">("all");
  const [draft, setDraft] = useState<Omit<CaseEntry, "id" | "createdAt">>({
    title: "",
    account: "",
    minutes: 0,
    status: "working",
    notes: "",
  });

  const add = () => {
    if (!draft.title.trim()) return;
    setCases([
      { ...draft, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      ...cases,
    ]);
    setDraft({ title: "", account: "", minutes: 0, status: "working", notes: "" });
  };

  const update = (id: string, patch: Partial<CaseEntry>) =>
    setCases(cases.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const remove = (id: string) => setCases(cases.filter((c) => c.id !== id));

  const filtered = filter === "all" ? cases : cases.filter((c) => c.status === filter);

  return (
    <Card className="border-border/70 p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Today's cases</h2>
          <p className="text-sm text-muted-foreground">
            Track count, minutes, and status per case.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All · {cases.length}
          </FilterChip>
          {(Object.keys(STATUS_META) as CaseStatus[]).map((s) => (
            <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
              <span
                className={`mr-1.5 inline-block h-2 w-2 rounded-full ${STATUS_META[s].dot}`}
              />
              {STATUS_META[s].label} · {cases.filter((c) => c.status === s).length}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-2 rounded-lg border border-border/60 bg-secondary/50 p-4 md:grid-cols-12">
        <Input
          className="bg-background md:col-span-3"
          placeholder="Case # / title"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <Input
          className="bg-background md:col-span-3"
          placeholder="Account"
          value={draft.account}
          onChange={(e) => setDraft({ ...draft, account: e.target.value })}
        />
        <Input
          className="bg-background md:col-span-2"
          type="number"
          min={0}
          placeholder="Minutes"
          value={draft.minutes || ""}
          onChange={(e) => setDraft({ ...draft, minutes: Number(e.target.value) || 0 })}
        />
        <Select
          value={draft.status}
          onValueChange={(v) => setDraft({ ...draft, status: v as CaseStatus })}
        >
          <SelectTrigger className="bg-background md:col-span-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_META) as CaseStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="md:col-span-2" onClick={add}>
          <Plus className="mr-1 h-4 w-4" /> Add case
        </Button>
      </div>

      <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No cases yet. Add one above.
          </p>
        )}
        {filtered.map((c) => {
          const meta = STATUS_META[c.status];
          return (
            <div
              key={c.id}
              className={`group rounded-lg border border-border/60 ${meta.bg} p-3 transition`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                <div className="min-w-[180px] flex-1">
                  <p className="font-medium text-foreground">{c.title}</p>
                  {c.account && <p className="text-xs text-muted-foreground">{c.account}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    className="h-8 w-20 bg-background"
                    value={c.minutes}
                    onChange={(e) => update(c.id, { minutes: Number(e.target.value) || 0 })}
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
                <Select
                  value={c.status}
                  onValueChange={(v) => update(c.id, { status: v as CaseStatus })}
                >
                  <SelectTrigger className="h-8 w-32 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_META) as CaseStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_META[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 opacity-60 hover:opacity-100"
                  onClick={() => remove(c.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                placeholder="Notes / steps taken..."
                value={c.notes}
                onChange={(e) => update(c.id, { notes: e.target.value })}
                className="mt-2 min-h-[60px] bg-background/70 text-sm"
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}
