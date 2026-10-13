import { supabase } from "@/lib/supabase/client";

export const AUTH_REQUIRED_ERROR = "AUTH_REQUIRED";

export async function requireSupabaseUserId() {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error(AUTH_REQUIRED_ERROR);
  }

  return user.id;
}

// The sign-in page, set to come back to the current screen afterwards.
export function authPath() {
  if (typeof window === "undefined") return "/auth";
  const here = window.location.pathname + window.location.search;
  return `/auth?next=${encodeURIComponent(here)}`;
}
