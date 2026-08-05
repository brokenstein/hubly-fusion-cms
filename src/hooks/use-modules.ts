import {
  Activity,
  Calculator,
  ClipboardList,
  Link2,
  MonitorSmartphone,
  Palette,
} from "lucide-react";

import { useCloudState } from "@/hooks/use-cloud-state";

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

/** Per-user enabled/disabled state for each workspace module. */
export function useModules() {
  const [toggles, setToggles, loaded] = useCloudState<ModuleToggles>(
    "module_toggles",
    DEFAULT_MODULE_TOGGLES,
  );

  const enabled = { ...DEFAULT_MODULE_TOGGLES, ...(toggles ?? {}) } as ModuleToggles;

  const setModule = (key: ModuleKey, value: boolean) =>
    setToggles({ ...enabled, [key]: value });

  return { enabled, setModule, loaded };
}
