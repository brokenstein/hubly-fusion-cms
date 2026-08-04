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

const GENERIC = new Set([
  "#000000",
  "#ffffff",
  "#fefefe",
  "#f9f9f9",
  "#fafafa",
  "#eeeeee",
  "#dddddd",
  "#cccccc",
  "#999999",
  "#888888",
  "#666666",
  "#333333",
  "#111111",
]);

function expandHex(hex: string): string {
  const h = hex.toLowerCase();
  return h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[r, g, b].map((n) => clamp(n).toString(16).padStart(2, "0")).join("")}`;
}

function collectColors(source: string, counts: Map<string, number>) {
  for (const m of source.matchAll(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    const full = expandHex(m[0]);
    counts.set(full, (counts.get(full) ?? 0) + 1);
  }
  for (const m of source.matchAll(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/gi)) {
    const hex = rgbToHex(Number(m[1]), Number(m[2]), Number(m[3]));
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
}

function collectFonts(source: string, fonts: Set<string>) {
  for (const m of source.matchAll(/font-family\s*:\s*([^;"'}]+)/gi)) {
    for (const part of (m[1] ?? "").split(",")) {
      const name = part.replace(/["']/g, "").trim();
      if (
        name &&
        name.length < 40 &&
        !/^(inherit|initial|unset|var\(|-apple|blinkmacsystemfont|system-ui|ui-|sans-serif|serif|monospace|cursive|fantasy|emoji|icon)/i.test(
          name,
        )
      ) {
        fonts.add(name);
      }
    }
  }
  for (const m of source.matchAll(/@font-face[\s\S]{0,400}?font-family\s*:\s*["']?([^;"'}]+)/gi)) {
    const name = (m[1] ?? "").trim();
    if (name && name.length < 40) fonts.add(name);
  }
  for (const m of source.matchAll(/fonts\.(?:googleapis|bunny|gstatic)\.com\/css2?\?([^"'>]+)/gi)) {
    for (const fam of (m[1] ?? "").matchAll(/family=([^&:]+)/g)) {
      fonts.add(decodeURIComponent(fam[1] ?? "").replace(/\+/g, " ").trim());
    }
  }
}

async function fetchText(url: string, accept: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        accept,
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function urlIsImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    if (!res.ok) return false;
    const type = res.headers.get("content-type") ?? "";
    return type.startsWith("image/");
  } catch {
    return false;
  }
}

async function pickLogo(html: string, url: string): Promise<string | null> {
  const meta = (pattern: RegExp) => html.match(pattern)?.[1]?.trim() ?? null;
  const host = new URL(url).hostname.replace(/^www\./, "");

  // Prefer inline <img> tags that look like a logo, then metadata, then icon services.
  const imgLogos: string[] = [];
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/logo|brand|wordmark/i.test(tag)) continue;
    const src =
      tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ??
      tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1] ??
      tag.match(/\bsrcset=["']([^"'\s,]+)/i)?.[1];
    if (src && !src.startsWith("data:")) imgLogos.push(src);
  }

  const svgUse = html.match(/<use\b[^>]*href=["']([^"']*logo[^"']*)["']/i)?.[1];

  const candidates = [
    ...imgLogos.slice(0, 4),
    svgUse ?? null,
    meta(/<meta[^>]+property=["']og:logo["'][^>]+content=["']([^"']+)["']/i),
    meta(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i),
    meta(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*apple-touch-icon[^"']*["']/i),
    meta(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i),
    meta(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i),
    meta(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*icon[^"']*["']/i),
  ].filter(Boolean) as string[];

  const absolutes = candidates
    .map((c) => absolute(c, url))
    .filter((c): c is string => Boolean(c) && !c.endsWith(".svg#"));

  for (const candidate of absolutes.slice(0, 6)) {
    if (await urlIsImage(candidate)) return candidate;
  }

  // Reliable fallbacks that always render something recognisable.
  const clearbit = `https://logo.clearbit.com/${host}`;
  if (await urlIsImage(clearbit)) return clearbit;
  return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
}

export async function fetchSiteSnapshot(url: string) {
  const html = await fetchText(url, "text/html,application/xhtml+xml");
  if (html === null) throw new Error("That site could not be reached");
  const page = html.slice(0, 600_000);

  const meta = (pattern: RegExp) => page.match(pattern)?.[1]?.trim() ?? null;

  const title =
    meta(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ??
    meta(/<title[^>]*>([^<]+)<\/title>/i)?.split(/[|\-–—:]/)[0]?.trim() ??
    new URL(url).hostname.replace(/^www\./, "");

  const description =
    meta(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ??
    meta(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ??
    "";

  const counts = new Map<string, number>();
  const fontSet = new Set<string>();
  collectColors(page, counts);
  collectFonts(page, fontSet);

  // Most sites keep their palette in external stylesheets, so read a few of them.
  const sheetHrefs: string[] = [];
  for (const m of page.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/rel=["'][^"']*stylesheet/i.test(tag)) continue;
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    const abs = href ? absolute(href, url) : null;
    if (abs && !/fonts\.(googleapis|bunny)\.com/i.test(abs)) sheetHrefs.push(abs);
    if (abs && /fonts\.(googleapis|bunny)\.com/i.test(abs)) collectFonts(abs, fontSet);
  }

  const sheets = await Promise.all(
    sheetHrefs.slice(0, 4).map((href) => fetchText(href, "text/css")),
  );
  for (const css of sheets) {
    if (!css) continue;
    const trimmed = css.slice(0, 500_000);
    collectColors(trimmed, counts);
    collectFonts(trimmed, fontSet);
  }

  const ranked = [...counts.entries()]
    .filter(([hex]) => !GENERIC.has(hex))
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex);

  const colors = (ranked.length ? ranked : [...counts.keys()]).slice(0, 12);

  const logo_url = await pickLogo(page, url);

  return {
    title,
    description,
    logo_url,
    colors,
    fonts: [...fontSet].slice(0, 8),
    textSample: page
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
            "colors: pick 4-6 hex codes from the candidates that best represent the brand (brand accents first, then supporting neutrals; drop near-duplicates). " +
            "If the candidates are unusable, infer plausible brand hex codes from the page text. " +
            "fonts: 1-3 real typeface names. notes: a 1-2 sentence brand summary.",
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
