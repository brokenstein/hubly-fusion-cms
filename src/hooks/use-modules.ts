import {
  Activity,
  Calculator,
  ClipboardList,
  FileText,
  Link2,
  MonitorSmartphone,
  Palette,
  StickyNote,
} from "lucide-react";


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const WORKSPACE_MODULES = [
  {
    key: "cases",
    to: "/cases",
    label: "Case Tracker",
    icon: ClipboardList,
    description: "Log cases, minutes worked and status trends.",
  },
  {
    key: "devices",
    to: "/devices",
    label: "Device Hub",
    icon: MonitorSmartphone,
    description: "Devices and the software versions approved for each.",
  },
  {
    key: "uptime",
    to: "/uptime",
    label: "Uptime Monitor",
    icon: Activity,
    description: "Live monitors from your Uptime Kuma status pages.",
  },
  {
    key: "dashy",
    to: "/links",
    label: "Link Tracker",
    icon: Link2,
    description: "Embed your Dashy dashboard of links in the workspace.",
  },
  {
    key: "brand",
    to: "/brand",
    label: "Brand Kits",
    icon: Palette,
    description: "Palettes, typography and logos captured per brand.",
  },
  {
    key: "roi",
    to: "/roi",
    label: "ROI Calculator",
    icon: Calculator,
    description: "Model savings and payback for a prospect.",
  },
] as const;

export type ModuleKey = (typeof WORKSPACE_MODULES)[number]["key"];

export type ModuleToggles = Record<ModuleKey, boolean>;

export const DEFAULT_MODULE_TOGGLES: ModuleToggles = {
  cases: true,
  devices: true,
  uptime: true,
  dashy: true,
  brand: false,
  roi: false,
};

/**
 * Workspace-wide enabled/disabled state for each module. Every signed-in user
 * reads the same list; only admins may change it (enforced by RLS).
 */
export function useModules() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["workspace_modules"],
    queryFn: async (): Promise<Partial<ModuleToggles>> => {
      const { data, error } = await supabase.from("workspace_modules").select("key, enabled");
      if (error) throw error;
      const map: Partial<ModuleToggles> = {};
      (data ?? []).forEach((row) => {
        map[row.key as ModuleKey] = row.enabled;
      });
      return map;
    },
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async ({ key, value }: { key: ModuleKey; value: boolean }) => {
      const { error } = await supabase
        .from("workspace_modules")
        .upsert({ key, enabled: value }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace_modules"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const enabled = { ...DEFAULT_MODULE_TOGGLES, ...(query.data ?? {}) } as ModuleToggles;

  const setModule = (key: ModuleKey, value: boolean) => mutation.mutate({ key, value });

  return { enabled, setModule, loaded: !query.isLoading };
}
