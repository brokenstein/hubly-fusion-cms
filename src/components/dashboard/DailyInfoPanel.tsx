import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { User } from "lucide-react";

interface Props {
  info: string;
  setInfo: (s: string) => void;
}

export function DailyInfoPanel({ info, setInfo }: Props) {
  return (
    <Card className="flex h-full flex-col border-border/70 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Daily reference</h2>
        <p className="text-sm text-muted-foreground">Status legend & RCA template.</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
        <Legend dotClass="bg-status-touched" label="Green – Touched" />
        <Legend dotClass="bg-status-other" label="Orange – Other" />
        <Legend dotClass="bg-status-closed" label="Magenta – Closed" />
        <Legend dotClass="bg-status-working" label="Yellow – Working" />
      </div>

      <label className="mb-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <User className="h-3 w-3" /> Scratchpad / RCA template
      </label>
      <Textarea
        value={info}
        onChange={(e) => setInfo(e.target.value)}
        className="min-h-[280px] flex-1 bg-background font-mono text-xs"
      />
    </Card>
  );
}

function Legend({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <span className="text-foreground">{label}</span>
    </div>
  );
}
