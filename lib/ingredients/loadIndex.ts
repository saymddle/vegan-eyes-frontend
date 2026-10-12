import { supabase } from "@/lib/supabase/client";
import {
  buildIndex,
  type IngredientIndex,
  type IngredientRow,
  type SynonymRow
} from "./matcher";

const PAGE_SIZE = 1000;
const CACHE_MS = 10 * 60 * 1000;

let cached: { index: IngredientIndex; loadedAt: number } | null = null;

async function loadIngredientRows() {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const rows: IngredientRow[] = [];

  // Supabase caps each response at 1000 rows, so page through the table.
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("ingredients")
      .select(
        "name, vegan_status, lab_note, swap_static, swap_functional, is_complex, aliases"
      )
      .order("id")
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error("Failed to load ingredients");
    }

    rows.push(...((data || []) as IngredientRow[]));
    if (!data || data.length < PAGE_SIZE) break;
  }

  if (rows.length === 0) {
    throw new Error("Ingredients table returned no rows");
  }

  return rows;
}

async function loadSynonymRows(): Promise<SynonymRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("synonyms")
    .select("alias, ingredients(name)");

  if (error || !data) return [];

  return data.flatMap((row) => {
    const linked = row.ingredients as { name: string } | { name: string }[] | null;
    const name = Array.isArray(linked) ? linked[0]?.name : linked?.name;
    return name ? [{ alias: row.alias as string, ingredient_name: name }] : [];
  });
}

export async function getIngredientIndex() {
  if (cached && Date.now() - cached.loadedAt < CACHE_MS) {
    return cached.index;
  }

  const [rows, synonyms] = await Promise.all([
    loadIngredientRows(),
    loadSynonymRows()
  ]);

  cached = { index: buildIndex(rows, synonyms), loadedAt: Date.now() };
  return cached.index;
}
