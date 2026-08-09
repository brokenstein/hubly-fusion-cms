import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireAuth } from "../supabase";

export default defineTool({
  name: "list_brand_kits",
  title: "List brand kits",
  description: "List the signed-in user's brand kits with palettes, fonts and logo URLs.",
  inputSchema: {
    search: z.string().trim().optional().describe("Filter by brand name substring."),
    limit: z.number().int().min(1).max(100).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    const supabase = requireAuth(ctx);
    let query = supabase
      .from("brand_kits")
      .select("id, name, source_url, logo_url, colors, fonts, notes, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit ?? 50);
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { brand_kits: data ?? [], count: data?.length ?? 0 },
    };
  },
});
