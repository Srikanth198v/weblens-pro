import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type SessionState = {
  session: Session | null;
  userId: string | null;
  email: string | null;
  loading: boolean;
};

/**
 * Single source of truth for "is someone signed in".
 * Registers the auth listener first, then reads the existing session, so a
 * sign-in that lands while we are loading is never missed.
 */
export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    void supabase.auth.getSession().then(({ data: existing }) => {
      setSession(existing.session);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return {
    session,
    userId: session?.user.id ?? null,
    email: session?.user.email ?? null,
    loading,
  };
}
