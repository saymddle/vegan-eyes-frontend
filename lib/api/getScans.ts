import { supabase } from "@/lib/supabase/client";
import type { SavedScan } from "@/lib/store/savedScans";
import type { UIResult } from "@/lib/types/result";
import { requireSupabaseUserId } from "./scansAuth";

type ScanRow = {
  id: string;
  input: string;
  result: UIResult;
  created_at: string;
};

function toSavedScan(row: ScanRow): SavedScan {
  return {
    id: row.id,
    input: row.input,
    result: row.result,
    timestamp: row.created_at
  };
}

export async function getScans(): Promise<SavedScan[]> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const userId = await requireSupabaseUserId();

  const { data, error } = await supabase
    .from("scans")
    .select("id, input, result, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to load scans");
  }

  return (data || []).map((row) => toSavedScan(row as ScanRow));
}

export async function getScanById(id: string): Promise<SavedScan | null> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const userId = await requireSupabaseUserId();

  const { data, error } = await supabase
    .from("scans")
    .select("id, input, result, created_at")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to load recipe");
  }

  return data ? toSavedScan(data as ScanRow) : null;
}
