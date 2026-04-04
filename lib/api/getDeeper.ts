import { supabase } from "@/lib/supabase/client";
import type { DeeperItem } from "@/lib/store/deeperStore";
import { requireSupabaseUserId } from "./scansAuth";

export async function getDeeper(): Promise<DeeperItem[]> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const userId = await requireSupabaseUserId();

  const { data, error } = await supabase
    .from("deeper_insights")
    .select("id, ingredient, reason, substitutes, is_favorite, created_at")
    .eq("user_id", userId)
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to load deeper insights");
  }

  return (data || []) as DeeperItem[];
}
