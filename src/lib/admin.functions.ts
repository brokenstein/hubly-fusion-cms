import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface WorkspaceUser {
  id: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
}

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("Unable to verify permissions");
  if (!data) throw new Error("Forbidden: admin access required");
}


export const listWorkspaceUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WorkspaceUser[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);

    const { data: roles, error: rErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rErr) throw new Error(rErr.message);

    const admins = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));

    return users.users.map((u) => ({
      id: u.id,
      email: u.email ?? "(no email)",
      createdAt: u.created_at,
      isAdmin: admins.has(u.id),
    }));
  });

export const setUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ userId: z.string().uuid(), isAdmin: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId && !data.isAdmin) {
      throw new Error("You cannot remove your own admin access");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.isAdmin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
