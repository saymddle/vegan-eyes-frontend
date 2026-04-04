import { supabase } from "@/lib/supabase/client";
import type { DeeperItem } from "@/lib/store/deeperStore";
import { requireSupabaseUserId } from "./scansAuth";

export async function toggleFavorite(
  id: string,
  nextFavorite: boolean
): Promise<DeeperItem> {
  const userId = await requireSupabaseUserId();

  const { data, error } = await supabase
    .from("deeper_insights")
    .update({ is_favorite: nextFavorite })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, ingredient, reason, substitutes, is_favorite, created_at")
    .single();

  if (error || !data) {
    throw new Error("Failed to update favorite");
  }

  return data as DeeperItem;
}
