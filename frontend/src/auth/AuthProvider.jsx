import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { DEFAULT_TZ } from "../lib/datetime.js";
import { AuthContext } from "./context.js";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileState, setProfileState] = useState({ userId: null, data: null });
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (event === "SIGNED_OUT") setRecovering(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;

  const profile = userId && profileState.userId === userId ? profileState.data : null;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    supabase
      .from("profiles")
      .select("id, username, timezone, email_notifications")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setProfileState({
          userId,
          data: data ?? { id: userId, username: "", timezone: DEFAULT_TZ, email_notifications: true },
        });
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const updateProfile = useCallback(
    async (patch) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", userId)
        .select("id, username, timezone, email_notifications")
        .single();
      if (error) throw error;
      setProfileState({ userId, data });
      return data;
    },
    [userId],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      profile,
      timezone: profile?.timezone ?? DEFAULT_TZ,
      recovering,
      setRecovering,
      updateProfile,
      signOut,
    }),
    [session, loading, profile, recovering, updateProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
