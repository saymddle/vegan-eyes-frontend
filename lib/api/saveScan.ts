import { supabase } from "@/lib/supabase/client";
import type { SavedScan } from "@/lib/store/savedScans";
import type { UIResult } from "@/lib/types/result";
import { requireSupabaseUserId } from "./scansAuth";

type InsertedScanRow = {
  id: string;
  input: string;
  result: UIResult;
  created_at: string;
};

export async function saveScan(
  input: string,
  result: UIResult
): Promise<SavedScan> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const userId = await requireSupabaseUserId();

  const { data, error } = await supabase
    .from("scans")
    .insert({
      user_id: userId,
      input,
      result
    })
    .select("id, input, result, created_at")
    .single();

  if (error || !data) {
    throw new Error("Failed to save scan");
  }

  const row = data as InsertedScanRow;

  return {
    id: row.id,
    input: row.input,
    result: row.result,
    timestamp: row.created_at
  };
}

export async function deleteScan(id: string) {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const userId = await requireSupabaseUserId();

  const { error } = await supabase
    .from("scans")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to delete scan");
  }
}
