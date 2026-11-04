import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// The current sign-in. `undefined` while it is still being read.
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}
