import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireAuth } from "../supabase";

export default defineTool({
  name: "update_device",
  title: "Update device",
  description: "Update the name, model, OS, notes or download URL of one of the user's devices.",
  inputSchema: {
    id: z.string().uuid().describe("Device id (from list_devices)."),
    name: z.string().trim().min(1).optional(),
    model: z.string().trim().optional(),
    os: z.string().trim().optional(),
    notes: z.string().optional().describe("Free-form notes shown on the device card."),
    download_url: z.string().url().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, ...fields }, ctx) => {
    const supabase = requireAuth(ctx);
    const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    if (Object.keys(patch).length === 0)
      return { content: [{ type: "text", text: "No fields to update." }], isError: true };

    const { data, error } = await supabase
      .from("devices")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, name, model, os, notes, download_url");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data?.length)
      return { content: [{ type: "text", text: `No device found with id ${id}.` }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data[0], null, 2) }],
      structuredContent: { device: data[0] },
    };
  },
});
