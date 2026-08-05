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
  // Strip Uptime Kuma app paths so we never build /dashboard/dashboard or
  // /status/x/status/x when the user pastes a dashboard or status page URL.
  const path = url.pathname
    .replace(/\/+$/, "")
    .replace(/\/(dashboard|manage-status-page|settings|add)(\/.*)?$/i, "")
    .replace(/\/status(-page)?(\/[^/]*)?$/i, "")
    .replace(/\/+$/, "");
  return `${url.origin}${path}`;
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

/**
 * Uptime Kuma API keys only authenticate the Prometheus `/metrics` endpoint.
 * We use it as a fallback when no public status page is available.
 */
async function fetchViaMetrics(base: string, apiKey: string): Promise<UptimeSnapshot> {
  const res = await fetch(`${base}/metrics`, {
    headers: {
      // Basic auth with an empty username and the API key as the password.
      Authorization: `Basic ${btoa(`:${apiKey}`)}`,
      accept: "text/plain",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Uptime Kuma /metrics responded with ${res.status}`);
  }
  const text = await res.text();

  const parse = (metric: string) => {
    const out: { name: string; url: string | null; value: number }[] = [];
    const re = new RegExp(`^${metric}\\{([^}]*)\\}\\s+([-\\d.eE+]+)$`, "gm");
    for (const m of text.matchAll(re)) {
      const labels = m[1] ?? "";
      const name = labels.match(/monitor_name="([^"]*)"/)?.[1] ?? "Monitor";
      const rawUrl = labels.match(/monitor_url="([^"]*)"/)?.[1] ?? "";
      out.push({
        name,
        url: rawUrl && rawUrl !== "null" && rawUrl !== "https://" ? rawUrl : null,
        value: Number(m[2]),
      });
    }
    return out;
  };

  const statuses = parse("monitor_status");
  const responseTimes = parse("monitor_response_time");

  const monitors: UptimeMonitor[] = statuses.map((entry, index) => {
    const ping = responseTimes.find((r) => r.name === entry.name)?.value ?? null;
    return {
      id: index + 1,
      name: entry.name,
      url: entry.url,
      status: statusFromBeat(entry.value),
      uptime24h: null,
      avgPing: ping !== null && Number.isFinite(ping) ? Math.round(ping) : null,
      beats: [{ status: entry.value, time: new Date().toISOString(), ping }],
      groupName: "Monitors (API key)",
    };
  });

  return {
    title: "Uptime Kuma",
    description: "Live data read through the Uptime Kuma API key.",
    statusPageUrl: `${base}/dashboard`,
    monitors,
    upCount: monitors.filter((m) => m.status === "up").length,
    downCount: monitors.filter((m) => m.status === "down").length,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchStatusPage(baseUrl: string, slug: string): Promise<UptimeSnapshot> {
  const base = normalizeBase(baseUrl);
  const safeSlug = encodeURIComponent(slug.trim() || "default");
  const apiKey = process.env["UPTIME_KUMA_API_KEY"];

  let page: any;
  let heartbeat: any;
  try {
    [page, heartbeat] = await Promise.all([
      getJson(`${base}/api/status-page/${safeSlug}`),
      getJson(`${base}/api/status-page/heartbeat/${safeSlug}`),
    ]);
  } catch (error) {
    // No public status page? Fall back to the authenticated metrics endpoint.
    if (apiKey) return fetchViaMetrics(base, apiKey);
    throw error;
  }

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

  if (monitors.length === 0 && apiKey) {
    // Published page with nothing public on it — try the API key instead.
    try {
      return await fetchViaMetrics(base, apiKey);
    } catch {
      // Fall through to the (empty) status page result.
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
