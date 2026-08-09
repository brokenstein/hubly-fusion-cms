import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireAuth } from "../supabase";

export default defineTool({
  name: "list_uptime_sites",
  title: "List uptime monitors",
  description: "List the Uptime Kuma instances the signed-in user has connected to the workspace.",
  inputSchema: { limit: z.number().int().min(1).max(100).default(50) },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    const supabase = requireAuth(ctx);
    const { data, error } = await supabase
      .from("uptime_sites")
      .select("id, name, base_url, status_page_slug, sort_order")
      .order("sort_order")
      .limit(limit ?? 50);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { sites: data ?? [], count: data?.length ?? 0 },
    };
  },
});
