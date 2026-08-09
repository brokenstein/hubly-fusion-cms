import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireAuth } from "../supabase";

export default defineTool({
  name: "list_roi_deals",
  title: "List ROI deals",
  description: "List the signed-in user's saved ROI calculator deals with their inputs and computed results.",
  inputSchema: {
    search: z.string().trim().optional().describe("Filter by deal or company name substring."),
    limit: z.number().int().min(1).max(100).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    const supabase = requireAuth(ctx);
    let query = supabase
      .from("roi_deals")
      .select("id, name, company, template_id, template_name, values, results, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit ?? 50);
    if (search) query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { deals: data ?? [], count: data?.length ?? 0 },
    };
  },
});
