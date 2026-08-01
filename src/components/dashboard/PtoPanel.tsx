import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, ChevronDown, CalendarDays } from "lucide-react";
import type { PtoEntry } from "@/lib/case-types";

interface Props {
  pto: PtoEntry[];
  setPto: (p: PtoEntry[]) => void;
  ptoBalance: number;
  setPtoBalance: (n: number) => void;
}

export function PtoPanel({ pto, setPto, ptoBalance, setPtoBalance }: Props) {
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState<Omit<PtoEntry, "id">>({
    date: new Date().toISOString().slice(0, 10),
    hours: 8,
    type: "PTO",
    note: "",
  });

  const used = pto.reduce((s, p) => s + p.hours, 0);
  const remaining = ptoBalance - used;

  const add = () => {
    if (!draft.date) return;
    setPto([{ ...draft, id: crypto.randomUUID() }, ...pto]);
    setDraft({ ...draft, hours: 8, note: "" });
  };

  return (
    <Card className="border-border/70 p-0">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between px-6 py-3">
          <CollapsibleTrigger className="flex cursor-pointer items-center gap-2 text-left">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="text-base font-semibold leading-tight">PTO</h2>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium tabular-nums">{used}</span> used ·{" "}
                <span className="font-medium tabular-nums">{remaining}</span> remaining
              </p>
            </div>
            <ChevronDown
              className={`ml-2 h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          {!open && (
            <Button size="sm" onClick={() => setOpen(true)}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CollapsibleContent>
          <div className="px-6 pb-6">
            <div className="mb-4 flex items-center justify-end gap-2">
              <label className="text-xs text-muted-foreground">Balance (h)</label>
              <Input
                type="number"
                className="h-8 w-20 bg-background"
                value={ptoBalance}
                onChange={(e) => setPtoBalance(Number(e.target.value) || 0)}
              />
            </div>

            <div className="mb-3 grid grid-cols-12 gap-2 rounded-md border border-border/60 bg-secondary/50 p-3">
              <Input
                type="date"
                className="col-span-4 h-9 bg-background"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
              <Input
                type="number"
                className="col-span-2 h-9 bg-background"
                placeholder="hrs"
                value={draft.hours || ""}
                onChange={(e) => setDraft({ ...draft, hours: Number(e.target.value) || 0 })}
              />
              <Select
                value={draft.type}
                onValueChange={(v) => setDraft({ ...draft, type: v as PtoEntry["type"] })}
              >
                <SelectTrigger className="col-span-3 h-9 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PTO">PTO</SelectItem>
                  <SelectItem value="Sick">Sick</SelectItem>
                  <SelectItem value="Holiday">Holiday</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button className="col-span-3" onClick={add}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>

            <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
              {pto.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-md border border-border/60 bg-secondary/40 p-2 text-sm"
                >
                  <span className="w-24 tabular-nums">{p.date}</span>
                  <span className="w-12 tabular-nums">{p.hours}h</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {p.type}
                  </span>
                  <span className="flex-1 truncate text-xs text-muted-foreground">{p.note}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setPto(pto.filter((x) => x.id !== p.id))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {pto.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No PTO logged.</p>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
