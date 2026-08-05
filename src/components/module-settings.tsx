import { Settings2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { WORKSPACE_MODULES, useModules } from "@/hooks/use-modules";

export function ModuleSettings() {
  const [open, setOpen] = useState(false);
  const { enabled, setModule } = useModules();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Workspace modules"
          className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workspace modules</DialogTitle>
          <DialogDescription>
            Turn sections on or off for your own account. Disabled sections disappear from the
            sidebar.
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y divide-border">
          {WORKSPACE_MODULES.map((mod) => (
            <div key={mod.key} className="flex items-center gap-3 py-3">
              <mod.icon className="size-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{mod.label}</p>
                <p className="text-xs text-muted-foreground">{mod.description}</p>
              </div>
              <Switch
                checked={enabled[mod.key]}
                onCheckedChange={(v) => setModule(mod.key, v)}
                aria-label={`Enable ${mod.label}`}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
