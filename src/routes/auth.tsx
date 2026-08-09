import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, LayoutGrid } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleSignIn, safeNext } from "@/hooks/useGoogleSignIn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s['next'] === "string" ? s['next'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — OpsKit workspace" },
      {
        name: "description",
        content: "Sign in to OpsKit to manage cases, devices, uptime monitors and links.",
      },
      { property: "og:title", content: "Sign in — OpsKit workspace" },
      {
        property: "og:description",
        content: "Access your unified operations workspace: cases, devices, uptime, links.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const { next } = Route.useSearch();
  const target = safeNext(next);
  const google = useGoogleSignIn(target);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  function goAfterAuth() {
    if (target) {
      window.location.href = target;
      return;
    }
    navigate({ to: "/dashboard" });
  }

  useEffect(() => {
    if (!loading && session) goAfterAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    goAfterAuth();
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${target ?? "/dashboard"}`,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. Check your inbox if confirmation is required.");
  }


  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex surface-grid">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <LayoutGrid className="size-5 text-sidebar-primary" />
          OpsKit
        </Link>
        <div className="max-w-md space-y-4">
          <h1 className="font-display text-4xl leading-tight">
            Four tools. One operations workspace.
          </h1>
          <p className="text-sm text-sidebar-foreground/70">
            Case tracking, device software matrix, uptime monitoring and link dashboards — unified
            behind a single login with shared data.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">Cases · Devices · Uptime · Links</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-2xl">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your workspace to continue.
          </p>

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="w-full">
              <TabsTrigger value="signin" className="flex-1">
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">
                Create account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-up">Email</Label>
                  <Input
                    id="email-up"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-up">Password</Label>
                  <Input
                    id="password-up"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full gap-2" onClick={google}>
            <GoogleIcon className="size-4" />
            Continue with Google
          </Button>
        </div>
      </section>
    </main>
  );
}
