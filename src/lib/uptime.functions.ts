import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fetchStatusPage, type UptimeSnapshot } from "./uptime.server";

export const getUptimeStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        baseUrl: z.string().min(3).max(300),
        slug: z.string().min(1).max(120).default("default"),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<UptimeSnapshot> => {
    return fetchStatusPage(data.baseUrl, data.slug);
  });
