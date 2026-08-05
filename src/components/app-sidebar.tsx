import { Link, useLocation } from "@tanstack/react-router";
import { LayoutGrid, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ModuleSettings } from "@/components/module-settings";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { WORKSPACE_MODULES, useModules } from "@/hooks/use-modules";

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { enabled } = useModules();
  const { isAdmin } = useIsAdmin();
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  const items = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    ...WORKSPACE_MODULES.filter((m) => enabled[m.key]).map((m) => ({
      to: m.to,
      label: m.label,
      icon: m.icon,
    })),
    ...(isAdmin ? [{ to: "/admin", label: "User Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-1.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
            <LayoutGrid className="size-4" />
          </span>
          <span className="font-display text-base font-semibold">OpsKit</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith(item.to)}
                    tooltip={item.label}
                  >
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-1 px-1 py-1">
          <Avatar className="size-8">
            <AvatarFallback className="bg-sidebar-accent text-xs text-sidebar-accent-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{user?.email ?? "Signed in"}</p>
          </div>
          <ModuleSettings />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            onClick={() => signOut()}
            className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
