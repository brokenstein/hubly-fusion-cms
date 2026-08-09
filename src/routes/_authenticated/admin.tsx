import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { listWorkspaceUsers, setUserAdmin, type WorkspaceUser } from "@/lib/admin-users";
import { useIsAdmin } from "@/hooks/use-is-admin";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "User Admin — OpsKit workspace" },
      {
        name: "description",
        content: "Grant or revoke admin access for accounts in your OpsKit workspace.",
      },
      { property: "og:title", content: "User Admin — OpsKit workspace" },
      {
        property: "og:description",
        content: "Manage which workspace accounts have admin privileges.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const { isAdmin, loading } = useIsAdmin();

  const users = useQuery({
    queryKey: ["workspace_users"],
    queryFn: async (): Promise<WorkspaceUser[]> => listWorkspaceUsers(),
    enabled: isAdmin,
    retry: false,
  });

  const toggle = useMutation({
    mutationFn: async (vars: { userId: string; isAdmin: boolean }) => setUserAdmin(vars),
    onSuccess: () => {
      toast.success("Admin access updated");
      queryClient.invalidateQueries({ queryKey: ["workspace_users"] });
      queryClient.invalidateQueries({ queryKey: ["is_admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="p-10 text-center">
        <ShieldCheck className="mx-auto mb-3 size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          You need admin access to manage workspace users.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">User Admin</h1>
        <p className="text-sm text-muted-foreground">
          Toggle admin access for accounts in this workspace.
        </p>
      </header>

      {users.isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {users.isError && (
        <Card className="border-destructive/40 p-6 text-sm text-muted-foreground">
          {(users.error as Error).message}
        </Card>
      )}

      <div className="divide-y divide-border rounded-xl border border-border">
        {(users.data ?? []).map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{u.email}</p>
              <p className="text-xs text-muted-foreground">
                Joined {new Date(u.createdAt).toLocaleDateString()}
              </p>
            </div>
            {u.isAdmin && <Badge variant="secondary">Admin</Badge>}
            <Switch
              checked={u.isAdmin}
              aria-label={`Admin access for ${u.email}`}
              disabled={toggle.isPending}
              onCheckedChange={(v) => toggle.mutate({ userId: u.id, isAdmin: v })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
