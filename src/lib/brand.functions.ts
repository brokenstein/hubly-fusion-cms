import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  fetchSiteSnapshot,
  normalizeUrl,
  refineWithAi,
  type ExtractedBrand,
} from "./brand-extract.server";

export const extractBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ url: z.string().min(3).max(300) }).parse(data))
  .handler(async ({ data }): Promise<ExtractedBrand & { source_url: string }> => {
    const url = normalizeUrl(data.url);
    const snapshot = await fetchSiteSnapshot(url);
    const refined = await refineWithAi(snapshot, url);

    return {
      source_url: url,
      name: refined.name?.trim() || snapshot.title,
      logo_url: snapshot.logo_url,
      colors: (refined.colors?.length ? refined.colors : snapshot.colors).slice(0, 6),
      fonts: (refined.fonts?.length ? refined.fonts : snapshot.fonts).slice(0, 5),
      notes: refined.notes ?? snapshot.description,
    };
  });
