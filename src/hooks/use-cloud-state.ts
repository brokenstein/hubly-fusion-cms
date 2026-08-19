import { useEffect, useId, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Per-user cloud-backed state keyed by a string. Reads/writes are scoped to the
 * signed-in user via RLS on `public.app_state`, and realtime updates keep other
 * tabs/devices for the same user in sync.
 */
export function useCloudState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const instanceId = useId();
  const skipNextWrite = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** True while local edits are unsaved or a save is in flight. */
  const dirty = useRef(false);
  /** Serialized value of the last payload we wrote ourselves. */
  const lastWritten = useRef<string | null>(null);


  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setValue(initial);
      setLoaded(false);
      skipNextWrite.current = true;
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("app_state")
        .select("value")
        .eq("key", key)
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.error(`[cloud-state:${key}] load failed`, error);
        setLoaded(true);
        return;
      }

      if (data) {
        setValue(data.value as T);
        setLoaded(true);
        return;
      }

      setValue(initial);
      const { error: upErr } = await supabase.from("app_state").upsert(
        { key, user_id: userId, value: initial as never, updated_at: new Date().toISOString() },
        { onConflict: "user_id,key" },
      );
      if (upErr) console.error(`[cloud-state:${key}] seed failed`, upErr);
      setLoaded(true);
    })();

    const channel = supabase
      .channel(`app_state:${userId}:${key}:${instanceId}`)

      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_state", filter: `key=eq.${key}` },
        (payload) => {
          const row = payload.new as { value: T; user_id: string } | null;
          if (row && row.user_id === userId && row.value !== undefined) {
            skipNextWrite.current = true;
            setValue(row.value);
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, userId]);

  useEffect(() => {
    if (!loaded || !userId) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase.from("app_state").upsert(
        { key, user_id: userId, value: value as never, updated_at: new Date().toISOString() },
        { onConflict: "user_id,key" },
      );
      if (error) console.error(`[cloud-state:${key}] save failed`, error);
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [key, value, loaded, userId]);

  return [value, setValue, loaded] as const;
}
