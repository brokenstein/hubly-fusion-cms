import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Trash2, LogIn, LogOut, ChevronDown, Clock } from "lucide-react";
import type { PunchEntry } from "@/lib/case-types";

interface Props {
  punches: PunchEntry[];
  setPunches: (p: PunchEntry[]) => void;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}
function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

function hoursBetween(a: string, b: string) {
  if (!a || !b) return 0;
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  const mins = bh * 60 + bm - (ah * 60 + am);
  return mins > 0 ? mins / 60 : 0;
}

export function TimeCardPanel({ punches, setPunches }: Props) {
  const [open, setOpen] = useState(true);
  const today = todayDate();
  const openPunch = punches.find((p) => p.date === today && !p.punchOut);

  const punchIn = () => {
    setPunches([
      { id: crypto.randomUUID(), date: today, punchIn: nowTime(), punchOut: "", note: "" },
      ...punches,
    ]);
  };

  const punchOut = () => {
    if (!openPunch) return;
    setPunches(
      punches.map((p) => (p.id === openPunch.id ? { ...p, punchOut: nowTime() } : p)),
    );
  };

  const update = (id: string, patch: Partial<PunchEntry>) =>
    setPunches(punches.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const remove = (id: string) => setPunches(punches.filter((p) => p.id !== id));

  const LUNCH_HOURS = 1;
  const rawToday = punches
    .filter((p) => p.date === today)
    .reduce((s, p) => s + hoursBetween(p.punchIn, p.punchOut), 0);
  const todayTotal = rawToday > LUNCH_HOURS ? rawToday - LUNCH_HOURS : 0;

  return (
    <Card className="border-border/70 p-0">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between px-6 py-3">
          <CollapsibleTrigger className="flex cursor-pointer items-center gap-2 text-left">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="text-base font-semibold leading-tight">Time card</h2>
              <p className="text-xs text-muted-foreground">
                Today:{" "}
                <span className="font-medium tabular-nums">{todayTotal.toFixed(2)} h</span>
                <span className="ml-1 opacity-70">({rawToday.toFixed(2)}h − 1h lunch)</span>
              </p>
            </div>
            <ChevronDown
              className={`ml-2 h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          {!open ? (
            <Button size="sm" onClick={() => setOpen(true)}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          ) : openPunch ? (
            <Button size="sm" onClick={punchOut} variant="destructive">
              <LogOut className="mr-1 h-4 w-4" /> Punch out
            </Button>
          ) : (
            <Button size="sm" onClick={punchIn}>
              <LogIn className="mr-1 h-4 w-4" /> Punch in
            </Button>
          )}
        </div>
        <CollapsibleContent>
          <div className="max-h-[420px] space-y-2 overflow-y-auto px-6 pb-6 pr-1">
            {punches.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No punches yet.</p>
            )}
            {punches.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-12 items-center gap-2 rounded-md border border-border/60 bg-secondary/40 p-2"
              >
                <Input
                  type="date"
                  className="col-span-4 h-8 bg-background text-xs"
                  value={p.date}
                  onChange={(e) => update(p.id, { date: e.target.value })}
                />
                <Input
                  type="time"
                  className="col-span-3 h-8 bg-background text-xs"
                  value={p.punchIn}
                  onChange={(e) => update(p.id, { punchIn: e.target.value })}
                />
                <Input
                  type="time"
                  className="col-span-3 h-8 bg-background text-xs"
                  value={p.punchOut}
                  onChange={(e) => update(p.id, { punchOut: e.target.value })}
                />
                <span className="col-span-1 text-right text-xs tabular-nums text-muted-foreground">
                  {hoursBetween(p.punchIn, p.punchOut).toFixed(2)}h
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="col-span-1 h-7 w-7 justify-self-end"
                  onClick={() => remove(p.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
