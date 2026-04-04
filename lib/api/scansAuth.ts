import { supabase } from "@/lib/supabase/client";

export const AUTH_REQUIRED_ERROR = "AUTH_REQUIRED";

export async function requireSupabaseUserId() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error(AUTH_REQUIRED_ERROR);
  }

  return user.id;
}
