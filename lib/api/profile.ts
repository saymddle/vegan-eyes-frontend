import { supabase } from "@/lib/supabase/client";
import { requireSupabaseUserId } from "./scansAuth";

export type Profile = {
  displayName: string;
  bio: string;
};

function client() {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }
  return supabase;
}

export async function getProfile(): Promise<Profile> {
  const db = client();
  const userId = await requireSupabaseUserId();

  const { data, error } = await db
    .from("profiles")
    .select("display_name, bio")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  return {
    displayName: data?.display_name ?? "",
    bio: data?.bio ?? ""
  };
}

// The sign-up trigger creates the row, but older accounts may not have one,
// so this inserts when it is missing.
export async function saveProfile(profile: Profile): Promise<void> {
  const db = client();
  const userId = await requireSupabaseUserId();

  const { error } = await db.from("profiles").upsert({
    id: userId,
    display_name: profile.displayName.trim() || null,
    bio: profile.bio.trim() || null,
    updated_at: new Date().toISOString()
  });

  if (error) throw error;
}
