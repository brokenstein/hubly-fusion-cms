import { useState } from "react";
import { CalendarPlus, ChevronDown } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { DayHistory } from "@/lib/case-types";

interface Props {
  history: DayHistory[];
  today: string;
  todayCount: number;
  /** Render without the surrounding Card, for embedding in another panel. */
  embedded?: boolean;
}


function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function shiftDay(key: string, days: number) {
  const dt = new Date(key + "T00:00:00");
  dt.setDate(dt.getDate() + days);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Rolling log of how many brand-new cases were added each day. Collapsed by default. */
export function NewCasesLog({ history, today, todayCount, embedded = false }: Props) {
  const [open, setOpen] = useState(false);
  if (!today) return null;

  const byDate = new Map<string, number>();
  history.forEach((h) => byDate.set(h.date, h.newCasesAdded ?? 0));
  byDate.set(today, todayCount);

  const days = Array.from({ length: 14 }, (_, i) => shiftDay(today, -i));
  const rows = days.map((date) => ({ date, count: byDate.get(date) ?? 0 }));
  const max = Math.max(1, ...rows.map((r) => r.count));

  const week = rows.slice(0, 7).reduce((s, r) => s + r.count, 0);
  const twoWeeks = rows.reduce((s, r) => s + r.count, 0);

  const body = (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CollapsibleTrigger className="flex flex-1 cursor-pointer items-center gap-2 text-left">
          <CalendarPlus className="h-4 w-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold leading-tight">New cases log</h2>
            <p className="text-xs text-muted-foreground">
              New cases added each day · auto-logged
            </p>
          </div>
          <ChevronDown
            className={`ml-1 h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>
            Last 7 days <span className="font-semibold tabular-nums text-foreground">{week}</span>
          </span>
          <span>
            Last 14 days{" "}
            <span className="font-semibold tabular-nums text-foreground">{twoWeeks}</span>
          </span>
        </div>
      </div>

      <CollapsibleContent>
        <div className="mt-4 space-y-1.5">
          {rows.map((row) => (
            <div key={row.date} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs text-muted-foreground">
                {fmtDate(row.date)}
                {row.date === today && <span className="ml-1 text-primary">•</span>}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <span
                  className="block h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </span>
              <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums">
                {row.count}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  if (embedded) {
    return (
      <div className="mb-4 rounded-lg border border-border/60 bg-secondary/30 p-4">{body}</div>
    );
  }

  return <Card className="p-6">{body}</Card>;
}

