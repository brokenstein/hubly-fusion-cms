import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

interface Props {
  count: number;
  onChange: (n: number) => void;
}

export function NewCasesCounter({ count, onChange }: Props) {
  const inc = () => onChange(count + 1);
  const dec = () => onChange(Math.max(0, count - 1));

  return (
    <Card
      onClick={inc}
      className="flex cursor-pointer select-none items-start justify-between gap-4 border-border/70 p-5 transition hover:bg-secondary/40"
      role="button"
      aria-label="Increment new cases count"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          New cases
        </p>
        <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{count}</p>
        <p className="mt-1 text-xs text-muted-foreground">Tap card to add · resets daily</p>
      </div>
      <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
        <Button size="icon" variant="secondary" className="h-7 w-7" onClick={inc} aria-label="Add">
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={dec} aria-label="Subtract">
          <Minus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
