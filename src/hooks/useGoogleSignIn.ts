import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

/** Only same-origin relative paths are safe redirect targets. */
export function safeNext(next?: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export function useGoogleSignIn(next?: string | null) {
  const navigate = useNavigate();
  const target = safeNext(next);

  async function signInWithGoogle() {
    const host = window.location.hostname;
    const isLovableHosted =
      host.endsWith(".lovable.app") ||
      host.endsWith(".lovable.dev") ||
      host.endsWith(".lovableproject.com");

    if (!isLovableHosted) {
      const redirectTo = target
        ? `${window.location.origin}/auth?next=${encodeURIComponent(target)}`
        : `${window.location.origin}/auth`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        const msg = /missing oauth secret|unsupported provider/i.test(error.message)
          ? "Google sign-in isn't configured for this domain. Add your own Google OAuth client ID and secret in the backend auth settings (Users → Auth Settings → Google), then add this origin to the allowed redirect URLs."
          : `Google sign-in failed: ${error.message}. Add ${window.location.origin}/auth to the allowed redirect URLs in your backend auth settings.`;
        toast.error(msg);
      }
      return;
    }

    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: target ? `${window.location.origin}${target}` : window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    if (target) {
      window.location.href = target;
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return signInWithGoogle;
}
