import { supabase } from "@/lib/supabase/client";

// The phrase a user types to confirm. Matched without caring about case or
// extra spaces.
export const DELETE_PHRASE = "me no longer need Vegan Eyes";

export function matchesDeletePhrase(text: string) {
  const clean = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLowerCase();
  return clean(text) === clean(DELETE_PHRASE);
}

// Deletes the signed-in user's account and everything saved with it, through
// the delete_my_account database function, then signs out on this device.
export async function deleteMyAccount() {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { error } = await supabase.rpc("delete_my_account");
  if (error) throw error;
  // The account is gone, so only clear the session stored on this device.
  await supabase.auth.signOut({ scope: "local" });
}
