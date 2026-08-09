import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireAuth } from "../supabase";

export default defineTool({
  name: "list_cases",
  title: "List tracked cases",
  description:
    "Read the signed-in user's Case Tracker entries, including status and minutes worked, from the workspace state.",
  inputSchema: {
    status: z.enum(["open", "pending", "closed"]).optional().describe("Filter by case status."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status }, ctx) => {
    const supabase = requireAuth(ctx);
    const { data, error } = await supabase
      .from("app_state")
      .select("value")
      .eq("key", "dash.cases")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const all = Array.isArray(data?.value) ? (data.value as Array<Record<string, unknown>>) : [];
    const cases = status ? all.filter((c) => c['status'] === status) : all;
    return {
      content: [{ type: "text", text: JSON.stringify(cases, null, 2) }],
      structuredContent: { cases, count: cases.length },
    };
  },
});
