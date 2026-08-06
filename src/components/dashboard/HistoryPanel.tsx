import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, History, Trash2 } from "lucide-react";
import { STATUS_META, type DayHistory } from "@/lib/case-types";

interface Props {
  history: DayHistory[];
  setHistory: (h: DayHistory[]) => void;
}

function fmtDate(d: string) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function HistoryPanel({ history, setHistory }: Props) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const sorted = [...history].sort((a, b) => (a.date < b.date ? 1 : -1));

  const remove = (date: string) => {
    setHistory(history.filter((h) => h.date !== date));
    if (expanded === date) setExpanded(null);
  };

  return (
    <Card className="border-border/70 p-0">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between px-6 py-3">
          <CollapsibleTrigger className="flex cursor-pointer items-center gap-2 text-left">
            <History className="h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="text-base font-semibold leading-tight">Daily history</h2>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium tabular-nums">{sorted.length}</span> day
                {sorted.length === 1 ? "" : "s"} tracked · auto-saved
              </p>
            </div>
            <ChevronDown
              className={`ml-2 h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="px-6 pb-6">
            {sorted.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No history yet. Today's stats will appear here automatically.
              </p>
            )}
            <div className="max-h-[480px] space-y-1.5 overflow-y-auto pr-1">
              {sorted.map((h) => {
                const isToday = h.date === today;
                const isOpen = expanded === h.date;
                return (
                  <div key={h.date} className="rounded-md border border-border/60 bg-secondary/40">
                    <button
                      onClick={() => setExpanded(isOpen ? null : h.date)}
                      className="grid w-full grid-cols-12 items-center gap-2 rounded-md p-2.5 text-left transition hover:bg-secondary/60"
                    >
                      <span className="col-span-3 flex items-center gap-2 text-sm font-medium">
                        {fmtDate(h.date)}
                        {isToday && (
                          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                            Today
                          </span>
                        )}
                      </span>
                      <span className="col-span-2 text-xs tabular-nums">
                        <span className="text-muted-foreground">New </span>
                        <span className="font-medium text-primary">{h.newCasesAdded ?? 0}</span>
                      </span>
                      <span className="col-span-2 text-xs tabular-nums">
                        <span className="text-muted-foreground">Cases </span>
                        <span className="font-medium">{h.caseCount}</span>
                      </span>
                      <span className="col-span-2 text-xs tabular-nums">
                        <span className="text-muted-foreground">Min </span>
                        <span className="font-medium">{h.totalMinutes}</span>
                      </span>
                      <span className="col-span-2 text-xs tabular-nums">
                        <span className="text-muted-foreground">Hrs </span>
                        <span className="font-medium">{h.hoursWorked.toFixed(2)}</span>
                      </span>
                      <span className="col-span-1 text-xs tabular-nums">
                        <span className="text-muted-foreground">PTO </span>
                        <span className="font-medium">{h.ptoUsed}h</span>
                      </span>

                      <span className="col-span-1 flex items-center justify-end gap-1">
                        {(["touched", "working", "other", "closed"] as const).map((s) =>
                          h.byStatus[s] > 0 ? (
                            <span
                              key={s}
                              title={`${STATUS_META[s].label}: ${h.byStatus[s]}`}
                              className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`}
                            />
                          ) : null,
                        )}
                        <ChevronDown
                          className={`ml-1 h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="space-y-2 border-t border-border/60 p-3">
                        <div className="flex flex-wrap gap-2 text-xs">
                          {(h.newCasesAdded ?? 0) > 0 && (
                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary">
                              New cases added: {h.newCasesAdded}
                            </span>
                          )}
                          {(["touched", "working", "other", "closed"] as const).map((s) => (
                            <span
                              key={s}
                              className={`rounded-full px-2 py-0.5 ${STATUS_META[s].bg}`}
                            >
                              <span
                                className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${STATUS_META[s].dot}`}
                              />
                              {STATUS_META[s].label}: {h.byStatus[s]}
                            </span>
                          ))}
                        </div>
                        {h.cases.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No cases recorded.</p>
                        ) : (
                          <div className="space-y-1">
                            {h.cases.map((c, i) => (
                              <div
                                key={i}
                                className={`rounded p-2 text-xs ${STATUS_META[c.status].bg} border border-border/40`}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${STATUS_META[c.status].dot}`}
                                  />
                                  <span className="font-medium">{c.title}</span>
                                  {c.account && (
                                    <span className="text-muted-foreground">· {c.account}</span>
                                  )}
                                  <span className="ml-auto tabular-nums text-muted-foreground">
                                    {c.minutes} min
                                  </span>
                                </div>
                                {c.notes && (
                                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                                    {c.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => remove(h.date)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete day
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
