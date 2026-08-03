// Server-only helpers for talking to an Uptime Kuma status page.

export interface UptimeMonitor {
  id: number;
  name: string;
  url: string | null;
  status: "up" | "down" | "pending" | "maintenance" | "unknown";
  uptime24h: number | null;
  avgPing: number | null;
  beats: { status: number; time: string; ping: number | null }[];
  groupName: string;
}

export interface UptimeSnapshot {
  title: string;
  description: string | null;
  statusPageUrl: string;
  monitors: UptimeMonitor[];
  upCount: number;
  downCount: number;
  fetchedAt: string;
}

export function normalizeBase(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported");
  }
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

function statusFromBeat(code: number | undefined): UptimeMonitor["status"] {
  switch (code) {
    case 0:
      return "down";
    case 1:
      return "up";
    case 2:
      return "pending";
    case 3:
      return "maintenance";
    default:
      return "unknown";
  }
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${url.replace(/^https?:\/\//, "")} responded with ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      "That URL did not return status page data. Check the Uptime Kuma URL and status page slug.",
    );
  }
}

export async function fetchStatusPage(baseUrl: string, slug: string): Promise<UptimeSnapshot> {
  const base = normalizeBase(baseUrl);
  const safeSlug = encodeURIComponent(slug.trim() || "default");

  const [page, heartbeat] = await Promise.all([
    getJson(`${base}/api/status-page/${safeSlug}`),
    getJson(`${base}/api/status-page/heartbeat/${safeSlug}`),
  ]);

  const beatsByMonitor: Record<string, any[]> = heartbeat?.heartbeatList ?? {};
  const uptimeList: Record<string, number> = heartbeat?.uptimeList ?? {};

  const monitors: UptimeMonitor[] = [];
  for (const group of page?.publicGroupList ?? []) {
    for (const monitor of group?.monitorList ?? []) {
      const beats = (beatsByMonitor[String(monitor.id)] ?? []).slice(-40);
      const last = beats[beats.length - 1];
      const pings = beats.map((b: any) => b?.ping).filter((p: any) => typeof p === "number");
      monitors.push({
        id: monitor.id,
        name: monitor.name ?? `Monitor ${monitor.id}`,
        url: typeof monitor.url === "string" && monitor.url !== "https://" ? monitor.url : null,
        status: statusFromBeat(last?.status),
        uptime24h:
          typeof uptimeList[`${monitor.id}_24`] === "number"
            ? (uptimeList[`${monitor.id}_24`] as number) * 100
            : null,
        avgPing: pings.length
          ? Math.round(pings.reduce((a: number, b: number) => a + b, 0) / pings.length)
          : null,
        beats: beats.map((b: any) => ({
          status: b?.status ?? -1,
          time: b?.time ?? "",
          ping: typeof b?.ping === "number" ? b.ping : null,
        })),
        groupName: group?.name ?? "Monitors",
      });
    }
  }

  return {
    title: page?.config?.title ?? "Status page",
    description: page?.config?.description ?? null,
    statusPageUrl: `${base}/status/${safeSlug}`,
    monitors,
    upCount: monitors.filter((m) => m.status === "up").length,
    downCount: monitors.filter((m) => m.status === "down").length,
    fetchedAt: new Date().toISOString(),
  };
}
