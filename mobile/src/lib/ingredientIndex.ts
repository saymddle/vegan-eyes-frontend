import Storage from "expo-sqlite/kv-store";
import {
  buildIndex,
  type IngredientIndex,
  type IngredientRow,
  type SynonymRow
} from "@shared/ingredients/matcher";
import snapshot from "../../../tests/fixtures/ingredients.json";
import { supabase } from "./supabase";

// The ingredient database lives on the phone, so checking works offline.
// The app starts from the copy built into it, then swaps in the latest
// rows from Supabase when there is a connection, and keeps them for next
// time.

type Tables = { ingredients: IngredientRow[]; synonyms: SynonymRow[] };

const CACHE_KEY = "ingredient-db-v1";
const PAGE_SIZE = 1000;

let current: IngredientIndex = buildIndex(
  (snapshot as Tables).ingredients,
  (snapshot as Tables).synonyms
);
let refreshing: Promise<void> | null = null;

export function getIndex() {
  return current;
}

async function fetchTables(): Promise<Tables> {
  const ingredients: IngredientRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("ingredients")
      .select("name, vegan_status, lab_note, swap_static, swap_functional, is_complex, aliases")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    ingredients.push(...((data ?? []) as IngredientRow[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  if (ingredients.length === 0) throw new Error("No ingredient rows");

  const { data } = await supabase.from("synonyms").select("alias, ingredients(name)");
  const synonyms = (data ?? []).flatMap((row) => {
    const linked = row.ingredients as { name: string } | { name: string }[] | null;
    const name = Array.isArray(linked) ? linked[0]?.name : linked?.name;
    return name ? [{ alias: row.alias as string, ingredient_name: name }] : [];
  });
  return { ingredients, synonyms };
}

// Loads the saved copy, then fetches the latest in the background.
export function refreshIndex() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const saved = await Storage.getItem(CACHE_KEY);
      if (saved) {
        const tables = JSON.parse(saved) as Tables;
        current = buildIndex(tables.ingredients, tables.synonyms);
      }
    } catch {
      // Keep the built-in copy.
    }
    try {
      const tables = await fetchTables();
      current = buildIndex(tables.ingredients, tables.synonyms);
      await Storage.setItem(CACHE_KEY, JSON.stringify(tables));
    } catch {
      // Offline: the saved or built-in copy is used.
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}
