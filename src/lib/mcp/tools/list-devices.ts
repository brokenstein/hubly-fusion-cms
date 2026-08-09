import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireAuth } from "../supabase";

export default defineTool({
  name: "list_devices",
  title: "List devices",
  description:
    "List the signed-in user's Device Hub devices with their platform group and approved software versions.",
  inputSchema: {
    platform: z.string().trim().optional().describe("Filter by platform/group name, e.g. VSN or ABN."),
    limit: z.number().int().min(1).max(200).default(100).describe("Maximum devices to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ platform, limit }, ctx) => {
    const supabase = requireAuth(ctx);
    const { data, error } = await supabase
      .from("devices")
      .select(
        "id, name, model, os, notes, image_url, download_url, sort_order, platforms(name), software_versions(name, version)",
      )
      .order("sort_order")
      .limit(limit ?? 100);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const rows = (data ?? []).filter((d) => {
      if (!platform) return true;
      const name = (d as { platforms?: { name?: string } | null }).platforms?.name ?? "";
      return name.toLowerCase() === platform.toLowerCase();
    });

    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { devices: rows, count: rows.length },
    };
  },
});
