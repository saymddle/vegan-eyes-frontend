import { supabase } from "@/lib/supabase/client";
import { requireSupabaseUserId } from "./scansAuth";

export type SwapReportReason =
  | "not_vegan"
  | "wrong_swap"
  | "already_vegan"
  | "other";

export type SwapReport = {
  ingredient: string;
  suggestedSwap?: string;
  recipeLine?: string;
  reason: SwapReportReason;
  note?: string;
};

// Saves a cook's report that a swap is wrong, for review in Supabase.
export async function reportSwap(report: SwapReport): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }
  const userId = await requireSupabaseUserId();

  const { error } = await supabase.from("swap_reports").insert({
    user_id: userId,
    ingredient: report.ingredient.slice(0, 200),
    suggested_swap: report.suggestedSwap?.slice(0, 300) ?? null,
    recipe_line: report.recipeLine?.slice(0, 500) ?? null,
    reason: report.reason,
    note: report.note?.trim().slice(0, 500) || null
  });

  if (error) throw error;
}
