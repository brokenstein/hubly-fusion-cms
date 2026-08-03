// Server-only helpers: fetch a website and derive a brand kit from it.

export interface ExtractedBrand {
  name: string;
  logo_url: string | null;
  colors: string[];
  fonts: string[];
  notes: string;
}

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported");
  }
  const host = url.hostname.toLowerCase();
  const blocked =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^(10|127)\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (blocked) throw new Error("That host is not reachable");
  return url.toString();
}

function absolute(candidate: string, base: string): string | null {
  try {
    return new URL(candidate, base).toString();
  } catch {
    return null;
  }
}

export async function fetchSiteSnapshot(url: string) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; OpsKitBrandBot/1.0)",
      accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Site responded with ${res.status}`);
  const html = (await res.text()).slice(0, 400_000);

  const meta = (pattern: RegExp) => html.match(pattern)?.[1]?.trim() ?? null;

  const title =
    meta(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ??
    meta(/<title[^>]*>([^<]+)<\/title>/i) ??
    new URL(url).hostname.replace(/^www\./, "");

  const description =
    meta(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ??
    meta(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ??
    "";

  const logoCandidates = [
    meta(/<meta[^>]+property=["']og:logo["'][^>]+content=["']([^"']+)["']/i),
    meta(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i),
    meta(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i),
    meta(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i),
    "/favicon.ico",
  ].filter(Boolean) as string[];

  const logo_url = logoCandidates.map((c) => absolute(c, url)).find(Boolean) ?? null;

  const hexes = Array.from(html.matchAll(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi)).map((m) =>
    m[0].toLowerCase(),
  );
  const counts = new Map<string, number>();
  for (const hex of hexes) {
    const full =
      hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
    counts.set(full, (counts.get(full) ?? 0) + 1);
  }
  const colors = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex)
    .slice(0, 8);

  const fontSet = new Set<string>();
  for (const m of html.matchAll(/font-family\s*:\s*([^;"'}]+)/gi)) {
    for (const part of (m[1] ?? "").split(",")) {
      const name = part.replace(/["']/g, "").trim();
      if (
        name &&
        name.length < 40 &&
        !/^(inherit|initial|unset|var\(|-apple|system-ui|sans-serif|serif|monospace|cursive)/i.test(
          name,
        )
      ) {
        fontSet.add(name);
      }
    }
  }
  for (const m of html.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/gi)) {
    fontSet.add(decodeURIComponent((m[1] ?? "").split(":")[0] ?? "").replace(/\+/g, " "));
  }

  return {
    title,
    description,
    logo_url,
    colors,
    fonts: [...fontSet].slice(0, 6),
    textSample: html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000),
  };
}

export async function refineWithAi(
  snapshot: Awaited<ReturnType<typeof fetchSiteSnapshot>>,
  url: string,
): Promise<Partial<ExtractedBrand>> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return {};

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You extract brand identity data from website scrapes. Reply with strict JSON only: " +
            '{"name":string,"colors":string[],"fonts":string[],"notes":string}. ' +
            "colors are 3-6 hex codes that best represent the brand (drop near-duplicates and generic greys). " +
            "fonts are real typeface names. notes is a 1-2 sentence brand summary.",
        },
        {
          role: "user",
          content: `URL: ${url}\nTitle: ${snapshot.title}\nDescription: ${snapshot.description}\nCandidate colors: ${snapshot.colors.join(", ")}\nCandidate fonts: ${snapshot.fonts.join(", ")}\nPage text: ${snapshot.textSample}`,
        },
      ],
    }),
  });

  if (!res.ok) return {};
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = json.choices?.[0]?.message?.content ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try {
    const parsed = JSON.parse(match[0]) as Partial<ExtractedBrand>;
    const out: Partial<ExtractedBrand> = {};
    if (typeof parsed.name === "string") out.name = parsed.name;
    if (Array.isArray(parsed.colors)) {
      out.colors = parsed.colors.filter(
        (c) => typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c),
      );
    }
    if (Array.isArray(parsed.fonts)) {
      out.fonts = parsed.fonts.filter((f) => typeof f === "string");
    }
    if (typeof parsed.notes === "string") out.notes = parsed.notes;
    return out;
  } catch {
    return {};
  }
}
