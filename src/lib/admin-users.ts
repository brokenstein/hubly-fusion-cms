import { supabase } from "@/integrations/supabase/client";

export interface WorkspaceUser {
  id: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
}

interface DbUserRow {
  id: string;
  email: string | null;
  created_at: string;
  is_admin: boolean;
}

type RpcFn = (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

// Admin management runs entirely through security-definer database functions
// (admin_list_users / admin_set_user_admin) that verify the caller's admin role
// in SQL. No private service-role key is needed, so this works on any
// self-hosted deployment with just the publishable key.
function rpc(): RpcFn {
  return supabase.rpc.bind(supabase) as unknown as RpcFn;
}

export async function listWorkspaceUsers(): Promise<WorkspaceUser[]> {
  const { data, error } = await rpc()("admin_list_users");
  if (error) throw new Error(error.message);

  return ((data ?? []) as DbUserRow[]).map((u) => ({
    id: u.id,
    email: u.email ?? "(no email)",
    createdAt: u.created_at,
    isAdmin: u.is_admin,
  }));
}

export async function setUserAdmin(input: { userId: string; isAdmin: boolean }) {
  const { error } = await rpc()("admin_set_user_admin", {
    _user_id: input.userId,
    _is_admin: input.isAdmin,
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}
