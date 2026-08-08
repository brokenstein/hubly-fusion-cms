import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export function useGoogleSignIn() {
  const navigate = useNavigate();

  async function signInWithGoogle() {
    const host = window.location.hostname;
    const isLovableHosted =
      host.endsWith(".lovable.app") ||
      host.endsWith(".lovable.dev") ||
      host.endsWith(".lovableproject.com");

    if (!isLovableHosted) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth` },
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
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return signInWithGoogle;
}
