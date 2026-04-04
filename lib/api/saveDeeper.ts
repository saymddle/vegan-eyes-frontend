import { supabase } from "@/lib/supabase/client";
import type {
  CreateDeeperItemInput,
  DeeperItem
} from "@/lib/store/deeperStore";
import { requireSupabaseUserId } from "./scansAuth";

export async function saveDeeper(
  item: CreateDeeperItemInput
): Promise<DeeperItem | null> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const userId = await requireSupabaseUserId();
  const ingredient = item.ingredient.trim();

  const { data: existing, error: lookupError } = await supabase
    .from("deeper_insights")
    .select("id, ingredient, reason, substitutes, is_favorite, created_at")
    .eq("user_id", userId)
    .ilike("ingredient", ingredient)
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    throw new Error("Failed to check saved insights");
  }

  if (existing) {
    return existing as DeeperItem;
  }

  const { data, error } = await supabase
    .from("deeper_insights")
    .insert({
      user_id: userId,
      ingredient,
      reason: item.reason,
      substitutes: item.substitutes,
      is_favorite: false
    })
    .select("id, ingredient, reason, substitutes, is_favorite, created_at")
    .single();

  if (error || !data) {
    throw new Error("Failed to save insight");
  }

  return data as DeeperItem;
}
